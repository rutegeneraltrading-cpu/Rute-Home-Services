import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/server/email/ses-mailer';
import { sendWhatsAppMessage } from '@/lib/server/whatsapp/twilio';
import {
  bookingAssignedToWorkerTemplate,
  bookingStatusUpdateTemplate,
  bookingCompletionTemplate,
} from '@/lib/server/email';
import type { BookingServiceDetail } from '@/lib/types/email';

interface Params {
  params: Promise<{ id: string }>;
}

type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';

type AssignmentStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'completed'
  | 'cancelled';

interface UpdateBookingPayload {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  worker_id?: string | null;
  auto_assign?: boolean;
  assignment_status?: AssignmentStatus;
  assignments?: { worker_id: string; status: AssignmentStatus }[];
}

const BOOKING_STATUS_VALUES: BookingStatus[] = [
  'pending',
  'confirmed',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
];

const PAYMENT_STATUS_VALUES: PaymentStatus[] = [
  'pending',
  'paid',
  'failed',
  'refunded',
  'cancelled',
];

const ASSIGNMENT_STATUS_VALUES: AssignmentStatus[] = [
  'pending',
  'accepted',
  'declined',
  'completed',
  'cancelled',
];

const MAX_EMAIL_SUBJECT_LENGTH = 70;

const buildServiceSubject = (serviceName: string, serviceCategory?: string) => {
  const title = serviceCategory
    ? `${serviceName} - ${serviceCategory}`
    : serviceName;
  return title.length > MAX_EMAIL_SUBJECT_LENGTH
    ? `${title.slice(0, MAX_EMAIL_SUBJECT_LENGTH - 3).trimEnd()}...`
    : title;
};

const buildWorkerAssignmentWhatsAppMessage = (params: {
  workerName: string;
  bookingId: string;
  serviceName: string;
  address?: string;
  bookingDate: string;
  bookingTime: string;
  customerName: string;
  appUrl: string;
}) => {
  let locationText = params.address || 'N/A';
  if (
    params.address &&
    params.address.includes('to=') &&
    params.address.includes('from=')
  ) {
    const addressParams = new URLSearchParams(params.address);
    const from = decodeURIComponent(addressParams.get('from') || 'N/A');
    const to = decodeURIComponent(addressParams.get('to') || 'N/A');
    locationText = `From: ${from}\nTo: ${to}`;
  }

  return [
    `Hi ${params.workerName},`,
    '',
    'You have a new booking assignment.',
    `Booking ID: ${params.bookingId}`,
    `Customer: ${params.customerName}`,
    `Service: ${params.serviceName}`,
    `Date: ${params.bookingDate}`,
    `Time: ${params.bookingTime}`,
    `Location: ${locationText}`,
    '',
    `Open: ${params.appUrl}/contact-us`,
  ].join('\n');
};

// Removed unused assignmentEventTime function

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampPercent = (value: number): number => {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 },
      );
    }

    let bookingQuery = supabaseAdmin.from('bookings').select('*').eq('id', id);

    if (profile.role !== 'admin') {
      bookingQuery = bookingQuery.eq('user_id', profile.id);
    }

    const { data: booking, error: bookingError } = await bookingQuery.single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const optionIds = Array.isArray(booking.selected_options)
      ? booking.selected_options.filter(Boolean)
      : [];
    const variantIds = Array.isArray(booking.selected_variants)
      ? booking.selected_variants.filter(Boolean)
      : [];

    const [
      { data: customer },
      { data: service },
      { data: assignmentsData },
      { data: optionsData },
      { data: variantsData },
      { data: bookingRating },
    ] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('id', booking.user_id)
        .single(),
      supabaseAdmin
        .from('services')
        .select(
          'id, name, slug, description, base_price, duration_minutes, is_active, category_id, platform_fee',
        )
        .eq('id', booking.service_id)
        .single(),
      supabaseAdmin
        .from('booking_assignments')
        .select(
          'booking_id, worker_id, status, assigned_at, accepted_at, declined_at, completed_at, cancelled_at, created_at',
        )
        .eq('booking_id', booking.id)
        .order('assigned_at', { ascending: false }),
      optionIds.length
        ? supabaseAdmin
            .from('service_options')
            .select(
              'id, service_id, name, description, type, price, duration_minutes, is_required, display_order, is_active, platform_fee',
            )
            .in('id', optionIds)
        : Promise.resolve({ data: [], error: null }),
      variantIds.length
        ? supabaseAdmin
            .from('service_requirements')
            .select(
              'id, service_id, name, type, price, duration_minutes, display_order, is_active',
            )
            .in('id', variantIds)
        : Promise.resolve({ data: [], error: null }),
      supabaseAdmin
        .from('booking_ratings')
        .select('rating, review, created_at, updated_at')
        .eq('booking_id', booking.id)
        .maybeSingle(),
    ]);

    // Get platform_fee for main service
    const servicePlatformFee = toNumber(service?.platform_fee, 0);

    // Get platform_fee for each selected option
    const optionPlatformFees = (optionsData || []).map((opt: unknown) =>
      toNumber((opt as { platform_fee?: number }).platform_fee, 0),
    );
    const totalOptionsPlatformFee = optionPlatformFees.reduce(
      (sum, fee) => sum + fee,
      0,
    );

    const totalPrice = toNumber(booking.total_price, 0);
    // Calculate platform fee amounts
    const servicePlatformFeeAmount = Number(
      ((totalPrice * servicePlatformFee) / 100).toFixed(2),
    );
    const optionsPlatformFeeAmount = Number(
      ((totalPrice * totalOptionsPlatformFee) / 100).toFixed(2),
    );
    const totalPlatformFeeAmount = Number(
      (servicePlatformFeeAmount + optionsPlatformFeeAmount).toFixed(2),
    );
    const workerPayoutAmount = Number(
      (totalPrice - totalPlatformFeeAmount).toFixed(2),
    );

    type AssignmentRow = {
      booking_id: string;
      worker_id: string;
      status: string;
      assigned_at: string | null;
      accepted_at: string | null;
      declined_at: string | null;
      completed_at: string | null;
      cancelled_at: string | null;
      created_at: string | null;
    };

    const assignments = (assignmentsData || []) as AssignmentRow[];
    // Calculate payout per active assignment (not cancelled/declined)
    const activeAssignments = assignments.filter(
      (a) => a.status !== 'cancelled' && a.status !== 'declined',
    );
    const perWorkerPayout =
      activeAssignments.length > 0
        ? Number((workerPayoutAmount / activeAssignments.length).toFixed(2))
        : 0;

    const assignmentsWithWorker = await Promise.all(
      assignments.map(async (a) => {
        let worker_name = null;
        let worker_email = null;
        let worker_phone = null;
        const { data: worker } = await supabaseAdmin
          .from('workers')
          .select('id, profile_id')
          .eq('id', a.worker_id)
          .single();
        if (worker?.profile_id) {
          const { data: workerProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, email, phone')
            .eq('id', worker.profile_id)
            .single();
          worker_name = workerProfile?.full_name || null;
          worker_email = workerProfile?.email || null;
          worker_phone = workerProfile?.phone || null;
        }
        // payout_amount: only for active assignments
        const payout_amount =
          a.status !== 'cancelled' && a.status !== 'declined'
            ? perWorkerPayout
            : 0;
        return {
          id: `${a.booking_id}_${a.worker_id}`,
          booking_id: a.booking_id,
          worker_id: a.worker_id,
          worker_name,
          worker_email,
          worker_phone,
          status: a.status,
          assigned_at: a.assigned_at,
          accepted_at: a.accepted_at,
          declined_at: a.declined_at,
          completed_at: a.completed_at,
          cancelled_at: a.cancelled_at,
          created_at: a.created_at,
          payout_amount,
        };
      }),
    );

    const optionsMap = new Map(
      (
        (optionsData || []) as Array<{
          id: string;
          service_id: string;
          name: string;
          description: string | null;
          type: string | null;
          price: number | null;
          duration_minutes: number | null;
          is_required: boolean | null;
          display_order: number | null;
          is_active: boolean | null;
        }>
      ).map((option) => [option.id, option]),
    );

    const variantsMap = new Map(
      (
        (variantsData || []) as Array<{
          id: string;
          service_id: string;
          name: string;
          type: string | null;
          price: number | null;
          duration_minutes: number | null;
          display_order: number | null;
          is_active: boolean | null;
        }>
      ).map((variant) => [variant.id, variant]),
    );

    const selectedOptionDetails = optionIds.map((id: string) => {
      const option = optionsMap.get(id);

      return {
        id,
        name: option?.name || id,
        service_id: option?.service_id,
        description: option?.description || null,
        type: option?.type || null,
        price: option?.price ?? null,
        duration_minutes: option?.duration_minutes ?? null,
        is_required: option?.is_required ?? null,
        display_order: option?.display_order ?? null,
        is_active: option?.is_active ?? null,
      };
    });

    const selectedVariantDetails = variantIds.map((id: string) => {
      const variant = variantsMap.get(id);
      return {
        id,
        name: variant?.name || id,
        type: variant?.type || null,
        price: variant?.price ?? null,
        duration_minutes: variant?.duration_minutes ?? null,
        display_order: variant?.display_order ?? null,
        is_active: variant?.is_active ?? null,
      };
    });

    const serviceDetails = service
      ? {
          id: service.id,
          name: service.name,
          slug: service.slug,
          description: service.description,
          base_price: service.base_price,
          duration_minutes: service.duration_minutes,
          is_active: service.is_active,
          platform_fee: servicePlatformFee,
          category: service.category_id ? { id: service.category_id } : null,
        }
      : null;

    return NextResponse.json({
      booking: {
        ...booking,
        service_platform_fee_percentage: servicePlatformFee,
        service_platform_fee_amount: servicePlatformFeeAmount,
        options_platform_fee_percentage: totalOptionsPlatformFee,
        options_platform_fee_amount: optionsPlatformFeeAmount,
        total_platform_fee_amount: totalPlatformFeeAmount,
        worker_payout_amount: workerPayoutAmount,
        customer_name: customer?.full_name || null,
        customer_email: customer?.email || null,
        customer_phone: customer?.phone || null,
        service_name: service?.name || null,
        service_details: serviceDetails,
        assignments: assignmentsWithWorker,
        rating_value: bookingRating?.rating ?? null,
        rating_review: bookingRating?.review ?? null,
        rating_submitted_at:
          bookingRating?.updated_at || bookingRating?.created_at || null,
        selected_option_details: selectedOptionDetails,
        selected_variant_details: selectedVariantDetails,
      },
    });
  } catch (error) {
    console.error('Fetch booking by id error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body: UpdateBookingPayload = await request.json();

    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 },
      );
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Support multi-worker assignment: assignments: {worker_id, status}[]
    const hasAssignmentsArray = Array.isArray(body.assignments);
    if (
      typeof body.status === 'undefined' &&
      typeof body.payment_status === 'undefined' &&
      typeof body.worker_id === 'undefined' &&
      typeof body.assignment_status === 'undefined' &&
      !body.auto_assign &&
      !hasAssignmentsArray
    ) {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 },
      );
    }
    // Multi-worker assignment logic
    if (hasAssignmentsArray) {
      // Fetch current assignments
      const { data: currentAssignments } = await supabaseAdmin
        .from('booking_assignments')
        .select('worker_id, status')
        .eq('booking_id', id);

      const currentMap = new Map(
        (currentAssignments || []).map((a: unknown) => {
          const assignment = a as { worker_id: string; status: string };
          return [assignment.worker_id, assignment.status];
        }),
      );
      const incomingMap = new Map(
        (body.assignments ?? []).map(
          (a: { worker_id: string; status: AssignmentStatus }) => [
            a.worker_id,
            a.status,
          ],
        ),
      );

      // Cancel assignments not in new list
      for (const [worker_id, status] of currentMap.entries()) {
        if (!incomingMap.has(worker_id) && status !== 'cancelled') {
          await supabaseAdmin
            .from('booking_assignments')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
            })
            .eq('booking_id', id)
            .eq('worker_id', worker_id);
        }
      }

      // Upsert or update assignments
      for (const { worker_id, status } of body.assignments ?? []) {
        const nowIso = new Date().toISOString();
        const assignmentUpdate: Record<string, unknown> = { status };
        if (status === 'pending') {
          assignmentUpdate.assigned_at = nowIso;
          assignmentUpdate.accepted_at = null;
          assignmentUpdate.declined_at = null;
          assignmentUpdate.completed_at = null;
          assignmentUpdate.cancelled_at = null;
        }
        if (status === 'accepted') {
          assignmentUpdate.assigned_at = nowIso;
          assignmentUpdate.accepted_at = nowIso;
          assignmentUpdate.declined_at = null;
          assignmentUpdate.completed_at = null;
          assignmentUpdate.cancelled_at = null;
        }
        if (status === 'declined') {
          assignmentUpdate.assigned_at = nowIso;
          assignmentUpdate.accepted_at = null;
          assignmentUpdate.declined_at = nowIso;
          assignmentUpdate.completed_at = null;
          assignmentUpdate.cancelled_at = null;
        }
        if (status === 'completed') {
          assignmentUpdate.assigned_at = nowIso;
          assignmentUpdate.accepted_at = null;
          assignmentUpdate.declined_at = null;
          assignmentUpdate.completed_at = nowIso;
          assignmentUpdate.cancelled_at = null;
        }
        if (status === 'cancelled') {
          assignmentUpdate.assigned_at = nowIso;
          assignmentUpdate.accepted_at = null;
          assignmentUpdate.declined_at = null;
          assignmentUpdate.completed_at = null;
          assignmentUpdate.cancelled_at = nowIso;
        }
        await supabaseAdmin.from('booking_assignments').upsert(
          {
            booking_id: id,
            worker_id,
            ...assignmentUpdate,
          },
          { onConflict: 'booking_id,worker_id' },
        );
      }
    }

    if (body.status && !BOOKING_STATUS_VALUES.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid booking status' },
        { status: 400 },
      );
    }

    if (
      body.payment_status &&
      !PAYMENT_STATUS_VALUES.includes(body.payment_status)
    ) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 },
      );
    }

    if (
      body.assignment_status &&
      !ASSIGNMENT_STATUS_VALUES.includes(body.assignment_status)
    ) {
      return NextResponse.json(
        { error: 'Invalid assignment status' },
        { status: 400 },
      );
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(
        'id, user_id, service_id, booking_date, booking_time, total_duration, status, address, unit_or_flat, notes',
      )
      .eq('id', id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { data: customerProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', booking.user_id)
      .maybeSingle();

    const { data: serviceData } = await supabaseAdmin
      .from('services')
      .select('name')
      .eq('id', booking.service_id)
      .maybeSingle();

    const bookingDate = String(booking.booking_date || 'N/A');
    const bookingTime = String(booking.booking_time || 'N/A');
    const serviceName = serviceData?.name || 'Service';
    const customerName = customerProfile?.full_name || 'Customer';
    const previousBookingStatus = String(booking.status || 'pending');
    const cancelledWorkerIds = new Set<string>();

    const { data: latestAssignmentRows } = await supabaseAdmin
      .from('booking_assignments')
      .select('worker_id, status, assigned_at, created_at')
      .eq('booking_id', id)
      .order('assigned_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    const latestAssignment = latestAssignmentRows?.[0] || null;

    const hasWorkerField = typeof body.worker_id !== 'undefined';
    const currentAssignedWorkerId = latestAssignment?.worker_id || null;
    let assignedWorkerId: string | null | undefined = hasWorkerField
      ? body.worker_id || null
      : undefined;
    const isWorkerReassignment =
      hasWorkerField && assignedWorkerId !== currentAssignedWorkerId;
    let didAssignWorker = false;

    if (body.auto_assign || isWorkerReassignment) {
      if (!body.auto_assign && assignedWorkerId === null) {
        await supabaseAdmin
          .from('booking_assignments')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('booking_id', id)
          .eq('worker_id', currentAssignedWorkerId)
          .in('status', ['pending', 'accepted']);
      } else {
        const { data: workers, error: workersError } = await supabaseAdmin.rpc(
          'get_available_workers_for_booking',
          {
            p_service_id: booking.service_id,
            p_booking_date: booking.booking_date,
            p_booking_time: booking.booking_time,
            p_duration_minutes: booking.total_duration,
          },
        );

        if (workersError) {
          return NextResponse.json(
            {
              error:
                workersError.message || 'Failed to check worker availability',
            },
            { status: 500 },
          );
        }

        const availableWorkers = (workers || []) as Array<{
          worker_id: string;
        }>;

        if (body.auto_assign && !assignedWorkerId) {
          assignedWorkerId = availableWorkers[0]?.worker_id || null;
          if (!assignedWorkerId) {
            return NextResponse.json(
              { error: 'No available worker found for this booking slot' },
              { status: 400 },
            );
          }
        }

        if (assignedWorkerId) {
          const isAllowedWorker = availableWorkers.some(
            (worker) => worker.worker_id === assignedWorkerId,
          );

          if (!isAllowedWorker) {
            return NextResponse.json(
              {
                error: 'Selected worker is not available for this booking slot',
              },
              { status: 400 },
            );
          }

          await supabaseAdmin
            .from('booking_assignments')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
            })
            .eq('booking_id', id)
            .neq('worker_id', assignedWorkerId)
            .in('status', ['pending', 'accepted']);

          if (
            currentAssignedWorkerId &&
            currentAssignedWorkerId !== assignedWorkerId
          ) {
            cancelledWorkerIds.add(currentAssignedWorkerId);
          }

          const { error: upsertAssignmentError } = await supabaseAdmin
            .from('booking_assignments')
            .upsert(
              {
                booking_id: id,
                worker_id: assignedWorkerId,
                status: 'pending',
                assigned_at: new Date().toISOString(),
                accepted_at: null,
                cancelled_at: null,
                declined_at: null,
                completed_at: null,
              },
              {
                onConflict: 'booking_id,worker_id',
              },
            );

          if (upsertAssignmentError) {
            return NextResponse.json(
              {
                error:
                  upsertAssignmentError.message || 'Failed to assign worker',
              },
              { status: 500 },
            );
          }

          const latestStatus = String(latestAssignment?.status || '');
          const hasSameActiveAssignment =
            currentAssignedWorkerId === assignedWorkerId &&
            (latestStatus === 'pending' || latestStatus === 'accepted');
          didAssignWorker = !hasSameActiveAssignment;
        }
      }
    }

    if (typeof body.assignment_status !== 'undefined') {
      const targetWorkerId =
        assignedWorkerId || latestAssignment?.worker_id || null;
      // removed assignmentStatusWorkerId assignment (no longer used)
      if (!targetWorkerId) {
        return NextResponse.json(
          { error: 'No worker assignment found to update assignment status' },
          { status: 400 },
        );
      }

      await supabaseAdmin
        .from('booking_assignments')
        .select('status')
        .eq('booking_id', id)
        .eq('worker_id', targetWorkerId)
        .maybeSingle();

      // removed unused previousTargetAssignmentStatus

      const nowIso = new Date().toISOString();
      const assignmentUpdate: Record<string, unknown> = {
        status: body.assignment_status,
      };

      if (body.assignment_status === 'pending') {
        assignmentUpdate.assigned_at = latestAssignment?.assigned_at || nowIso;
        assignmentUpdate.accepted_at = null;
        assignmentUpdate.declined_at = null;
        assignmentUpdate.completed_at = null;
        assignmentUpdate.cancelled_at = null;
      }

      if (body.assignment_status === 'accepted') {
        assignmentUpdate.assigned_at = latestAssignment?.assigned_at || nowIso;
        assignmentUpdate.accepted_at = nowIso;
        assignmentUpdate.declined_at = null;
        assignmentUpdate.completed_at = null;
        assignmentUpdate.cancelled_at = null;
      }

      if (body.assignment_status === 'declined') {
        assignmentUpdate.assigned_at = latestAssignment?.assigned_at || nowIso;
        assignmentUpdate.accepted_at = null;
        assignmentUpdate.declined_at = nowIso;
        assignmentUpdate.completed_at = null;
        assignmentUpdate.cancelled_at = null;
        cancelledWorkerIds.add(targetWorkerId);
      }

      if (body.assignment_status === 'completed') {
        assignmentUpdate.assigned_at = latestAssignment?.assigned_at || nowIso;
        assignmentUpdate.accepted_at =
          latestAssignment?.status === 'accepted' ? nowIso : null;
        assignmentUpdate.declined_at = null;
        assignmentUpdate.completed_at = nowIso;
        assignmentUpdate.cancelled_at = null;
      }

      if (body.assignment_status === 'cancelled') {
        assignmentUpdate.assigned_at = latestAssignment?.assigned_at || nowIso;
        assignmentUpdate.accepted_at = null;
        assignmentUpdate.declined_at = null;
        assignmentUpdate.completed_at = null;
        assignmentUpdate.cancelled_at = nowIso;
        cancelledWorkerIds.add(targetWorkerId);
      }

      const { error: assignmentUpdateError } = await supabaseAdmin
        .from('booking_assignments')
        .upsert(
          {
            booking_id: id,
            worker_id: targetWorkerId,
            ...assignmentUpdate,
          },
          {
            onConflict: 'booking_id,worker_id',
          },
        );

      if (assignmentUpdateError) {
        return NextResponse.json(
          {
            error:
              assignmentUpdateError.message ||
              'Failed to update assignment status',
          },
          { status: 500 },
        );
      }

      // removed shouldSendAssignmentAcceptedEmail assignment (no longer used)
    }

    const updatePayload: Record<string, unknown> = {};

    if (typeof body.status !== 'undefined') {
      updatePayload.status = body.status;
    }

    if (typeof body.payment_status !== 'undefined') {
      updatePayload.payment_status = body.payment_status;
    }

    if (didAssignWorker) {
      updatePayload.status = 'assigned';
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message || 'Failed to update booking' },
          { status: 500 },
        );
      }
    }

    const { data: updatedBooking, error: getUpdatedError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (getUpdatedError) {
      return NextResponse.json(
        { error: 'Failed to fetch updated booking' },
        { status: 500 },
      );
    }

    // If booking status is being set to completed, update all relevant worker assignments to completed
    if (typeof body.status !== 'undefined' && body.status === 'completed') {
      // Fetch all assignments for this booking
      const { data: allAssignmentsForCompletion } = await supabaseAdmin
        .from('booking_assignments')
        .select('worker_id, status')
        .eq('booking_id', id);

      // Find workers with status 'accepted' or 'in_progress' (not already completed/cancelled/declined)
      const toComplete = (allAssignmentsForCompletion || []).filter(
        (a) => a.status === 'accepted' || a.status === 'in_progress',
      );

      // Update their status to 'completed'
      for (const assignment of toComplete) {
        await supabaseAdmin
          .from('booking_assignments')
          .update({ status: 'completed' })
          .eq('booking_id', id)
          .eq('worker_id', assignment.worker_id);
      }
    }

    const getWorkerProfile = async (workerId: string) => {
      const { data: workerRow } = await supabaseAdmin
        .from('workers')
        .select('profile_id, phone')
        .eq('id', workerId)
        .maybeSingle();

      if (!workerRow?.profile_id) return null;

      const { data: workerProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', workerRow.profile_id)
        .maybeSingle();

      if (!workerProfile) return null;

      return {
        ...workerProfile,
        phone: workerProfile.phone || workerRow.phone || null,
      };
    };

    const getServiceDetails = async (): Promise<
      BookingServiceDetail & { categoryFeePercent?: number }
    > => {
      const details: BookingServiceDetail & { categoryFeePercent?: number } = {
        name: serviceName,
      };

      if (booking.service_id) {
        const { data: svcData } = await supabaseAdmin
          .from('services')
          .select('id, category_id')
          .eq('id', booking.service_id)
          .maybeSingle();

        if (svcData?.category_id) {
          const { data: catData } = await supabaseAdmin
            .from('service_categories')
            .select('name, service_fee')
            .eq('id', svcData.category_id)
            .maybeSingle();
          details.category = catData?.name;
          details.categoryFeePercent = clampPercent(
            toNumber(catData?.service_fee, 0),
          );
        }

        if (updatedBooking.selected_options?.length > 0) {
          const { data: optData } = await supabaseAdmin
            .from('service_options')
            .select('id, name, description, price')
            .in('id', updatedBooking.selected_options);
          details.options = (optData || []).map((opt: unknown) => {
            const o = opt as {
              name: string;
              description?: string;
              price?: number;
            };
            return {
              name: o.name,
              description: o.description || undefined,
              price: o.price ?? undefined,
            };
          });
        }

        if (updatedBooking.selected_variants?.length > 0) {
          const { data: varData } = await supabaseAdmin
            .from('service_requirements')
            .select('id, name, type, price')
            .in('id', updatedBooking.selected_variants);
          details.requirements = (varData || []).map((v: unknown) => {
            const variable = v as {
              name: string;
              type?: string;
              price?: number;
            };
            return {
              name: variable.name,
              type: variable.type || undefined,
              price: variable.price ?? undefined,
            };
          });
        }
      }

      return details;
    };

    const serviceDetailsForEmails = await getServiceDetails();
    const bookingAddressForEmails = String(
      updatedBooking.address || booking.address || '',
    );
    const unitOrFlatForEmails =
      String(
        updatedBooking.unit_or_flat || booking.unit_or_flat || '',
      ).trim() || undefined;
    const notesForEmails =
      String(updatedBooking.notes || booking.notes || '').trim() || undefined;
    const serviceSubject = buildServiceSubject(
      serviceDetailsForEmails.name || serviceName,
      serviceDetailsForEmails.category,
    );
    const bookingTotalForPayout = toNumber(updatedBooking.total_price, 0);
    const serviceFeePercentForPayout = clampPercent(
      toNumber(serviceDetailsForEmails.categoryFeePercent, 0),
    );

    // (Removed: No email to admin/user on assignment status accepted/declined/cancelled)

    // Send updated assignment notifications (email + WhatsApp) to all active (pending/accepted) workers
    const isPaidBooking =
      String(updatedBooking.payment_status || '') === 'paid';
    const shouldSendWorkerAssignmentNotifications =
      isPaidBooking ||
      hasWorkerField ||
      !!body.auto_assign ||
      Array.isArray(body.assignments) ||
      body.status === 'assigned';

    if (shouldSendWorkerAssignmentNotifications) {
      const { data: allAssignments } = await supabaseAdmin
        .from('booking_assignments')
        .select('worker_id, status')
        .eq('booking_id', id);

      // Calculate per-worker payout (already divided in booking logic)
      const activeAssignments = (allAssignments || []).filter(
        (a) => a.status === 'pending' || a.status === 'accepted',
      );
      const perWorkerPayout =
        activeAssignments.length > 0
          ? Number(
              (bookingTotalForPayout / activeAssignments.length).toFixed(2),
            )
          : 0;

      // Deduplicate by worker_id
      const uniqueWorkerMap = new Map();
      for (const assignment of activeAssignments) {
        if (!uniqueWorkerMap.has(assignment.worker_id)) {
          uniqueWorkerMap.set(assignment.worker_id, assignment);
        }
      }
      for (const assignment of uniqueWorkerMap.values()) {
        const workerProfile = await getWorkerProfile(assignment.worker_id);
        if (workerProfile?.email) {
          try {
            await sendEmail({
              to: workerProfile.email,
              subject: `New Booking Assigned - ${serviceSubject}`,
              html: bookingAssignedToWorkerTemplate({
                workerName: workerProfile.full_name || 'Worker',
                bookingId: id,
                service: serviceDetailsForEmails,
                address: bookingAddressForEmails,
                unitOrFlat: unitOrFlatForEmails,
                notes: notesForEmails,
                bookingDate,
                bookingTime,
                customerName,
                totalAmount: perWorkerPayout,
                serviceFeePercent: serviceFeePercentForPayout,
              }),
            });
          } catch (emailError) {
            console.error('Booking assigned worker email failed:', emailError);
          }
        }

        if (workerProfile?.phone) {
          try {
            await sendWhatsAppMessage({
              to: workerProfile.phone,
              body: buildWorkerAssignmentWhatsAppMessage({
                workerName: workerProfile.full_name || 'Worker',
                bookingId: id,
                serviceName: serviceDetailsForEmails.name || serviceName,
                address: bookingAddressForEmails,
                bookingDate,
                bookingTime,
                customerName,
                appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
              }),
            });
          } catch (whatsAppError) {
            console.error(
              'Booking assigned worker WhatsApp send failed:',
              whatsAppError,
            );
          }
        } else {
          console.warn(
            'Booking assigned worker WhatsApp skipped: worker phone missing',
            {
              bookingId: id,
              workerId: assignment.worker_id,
            },
          );
        }
      }
    }

    // Send email to user when booking status is set to 'assigned'
    if (
      typeof body.status !== 'undefined' &&
      body.status === 'assigned' &&
      previousBookingStatus !== 'assigned' &&
      customerProfile?.email
    ) {
      // Fetch all current assignments for this booking
      const { data: allAssignments } = await supabaseAdmin
        .from('booking_assignments')
        .select('worker_id, status')
        .eq('booking_id', id);

      // Only include workers whose status is not declined, cancelled, or completed
      const assignedWorkerIds = (allAssignments || [])
        .filter(
          (a) =>
            a.status !== 'declined' &&
            a.status !== 'cancelled' &&
            a.status !== 'completed',
        )
        .map((a) => a.worker_id);

      // Get worker details
      const assignedWorkers = [];
      for (const workerId of assignedWorkerIds) {
        const { data: workerRow } = await supabaseAdmin
          .from('workers')
          .select('profile_id')
          .eq('id', workerId)
          .maybeSingle();
        if (workerRow?.profile_id) {
          const { data: workerProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email, phone')
            .eq('id', workerRow.profile_id)
            .maybeSingle();
          if (workerProfile) {
            assignedWorkers.push({
              name: workerProfile.full_name || 'Worker',
              email: workerProfile.email || '',
              phone: workerProfile.phone || '',
            });
          }
        }
      }

      // Compose worker details HTML
      let workersHtml = '';
      if (assignedWorkers.length > 0) {
        workersHtml =
          '<div style="margin-top:16px;">' +
          '<div style="font-weight:600;margin-bottom:8px;">Assigned Professionals:</div>' +
          assignedWorkers
            .map(
              (w) =>
                `<div style="margin-bottom:6px;">
                  <span style="font-weight:500;">${w.name}</span>
                  ${w.email ? `<span style=\"color:#6b7280;\"> &lt;${w.email}&gt;</span>` : ''}
                  ${w.phone ? `<span style=\"color:#6b7280;\"> (${w.phone})</span>` : ''}
                </div>`,
            )
            .join('') +
          '</div>';
      }

      // Use bookingStatusUpdateTemplate for now, with customHtml for workers
      try {
        await sendEmail({
          to: customerProfile.email,
          subject: `Booking Assigned - ${serviceSubject}`,
          html: bookingStatusUpdateTemplate({
            customerName,
            bookingId: id,
            service: serviceDetailsForEmails,
            address: bookingAddressForEmails,
            unitOrFlat: unitOrFlatForEmails,
            notes: notesForEmails,
            bookingDate,
            bookingTime,
            previousStatus: previousBookingStatus,
            newStatus: 'assigned',
            updatedAt: new Date().toLocaleString('en-ZA', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
            detailsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${id}`,
            customHtml: workersHtml,
          }),
        });
      } catch (emailError) {
        console.error('Booking assigned user email failed:', emailError);
      }
    }

    // (Removed: No email to admin/user on assignment status cancelled)
    // Send email to all workers with assignment status 'completed' (on status change to completed)
    // Re-fetch all assignments with status accepted or completed (after possible status updates above)
    const { data: completedAssignments } = await supabaseAdmin
      .from('booking_assignments')
      .select('worker_id, status')
      .eq('booking_id', id)
      .in('status', ['accepted', 'completed']);

    // Only count accepted/completed workers for payout calculation
    const payoutWorkerCount = (completedAssignments || []).length;
    const payoutAmount =
      payoutWorkerCount > 0
        ? Number(
            (
              toNumber(updatedBooking.total_price, 0) / payoutWorkerCount
            ).toFixed(2),
          )
        : 0;

    for (const assignment of completedAssignments || []) {
      // If not already completed, update to completed (should be handled above, but double-check)
      if (assignment.status !== 'completed') {
        await supabaseAdmin
          .from('booking_assignments')
          .update({ status: 'completed' })
          .eq('booking_id', id)
          .eq('worker_id', assignment.worker_id);
      }
      const workerProfile = await getWorkerProfile(assignment.worker_id);
      if (workerProfile?.email) {
        try {
          await sendEmail({
            to: workerProfile.email,
            subject: `Booking Assignment Completed - ${serviceSubject}`,
            html: await bookingCompletionTemplate({
              userEmail: workerProfile.email,
              userName: workerProfile.full_name || 'Worker',
              bookingId: id,
              serviceName: serviceDetailsForEmails.name,
              serviceCategory: serviceDetailsForEmails.category || 'General',
              bookingDate,
              bookingTime,
              workerName: workerProfile.full_name || 'Worker',
              workerImage: '',
              ratingLink: '',
              payoutAmount,
            }),
          });
        } catch (emailError) {
          console.error(
            'Booking assignment completed worker email failed:',
            emailError,
          );
        }
      }
    }

    const updatedStatus = String(updatedBooking.status || 'pending');

    // Handle booking completion - send rating email for each completed worker
    if (
      updatedStatus === 'completed' &&
      previousBookingStatus !== 'completed' &&
      customerProfile?.email
    ) {
      try {
        // Get all completed assignments for this booking
        const { data: completedAssignments } = await supabaseAdmin
          .from('booking_assignments')
          .select('worker_id')
          .eq('booking_id', id)
          .eq('status', 'completed');

        for (const assignment of completedAssignments || []) {
          // Get worker profile and avatar
          const { data: workerRow } = await supabaseAdmin
            .from('workers')
            .select('profile_id')
            .eq('id', assignment.worker_id)
            .maybeSingle();
          let workerNameForEmail = 'Assigned Professional';
          let workerImageForEmail: string | undefined;
          if (workerRow?.profile_id) {
            const { data: workerProfile } = await supabaseAdmin
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', workerRow.profile_id)
              .maybeSingle();
            if (workerProfile?.full_name) {
              workerNameForEmail = workerProfile.full_name;
            }
            if (workerProfile?.avatar_url) {
              workerImageForEmail = workerProfile.avatar_url;
            }
          }
          // Unique rating link per worker
          const ratingLink = `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${id}?rate=true&worker=${assignment.worker_id}`;
          await sendEmail({
            to: customerProfile.email,
            subject: `Booking Complete - Rate ${workerNameForEmail}`,
            html: await bookingCompletionTemplate({
              userEmail: customerProfile.email,
              userName: customerName,
              bookingId: id,
              serviceName: serviceDetailsForEmails.name,
              serviceCategory: serviceDetailsForEmails.category || 'General',
              bookingDate,
              bookingTime,
              workerName: workerNameForEmail,
              workerImage: workerImageForEmail,
              ratingLink,
            }),
          });
        }
      } catch (emailError) {
        console.error('Booking completion email failed:', emailError);
      }
    }
    // Send status update email for other allowed transitions
    else {
      const STATUS_UPDATE_NOTIFY_ALLOWED = new Set([
        'in_progress',
        'cancelled',
      ]);
      const shouldSendStatusUpdateEmail =
        !!customerProfile?.email &&
        previousBookingStatus !== updatedStatus &&
        STATUS_UPDATE_NOTIFY_ALLOWED.has(updatedStatus);

      if (shouldSendStatusUpdateEmail) {
        try {
          await sendEmail({
            to: customerProfile.email,
            subject: `Booking Status Updated - ${serviceSubject}`,
            html: bookingStatusUpdateTemplate({
              customerName,
              bookingId: id,
              service: serviceDetailsForEmails,
              address: bookingAddressForEmails,
              unitOrFlat: unitOrFlatForEmails,
              notes: notesForEmails,
              bookingDate,
              bookingTime,
              previousStatus: previousBookingStatus,
              newStatus: updatedStatus,
              updatedAt: new Date().toLocaleString('en-ZA', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
              detailsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${id}`,
            }),
          });
        } catch (emailError) {
          console.error('Booking status update email failed:', emailError);
        }
      }
    }

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
