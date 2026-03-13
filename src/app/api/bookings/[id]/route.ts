import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/server/email/ses-mailer';
import {
  bookingAssignedToWorkerTemplate,
  bookingAssignmentAcceptedTemplate,
  bookingAssignmentCancelledTemplate,
  bookingStatusUpdateTemplate,
  bookingCompletionTemplate,
} from '@/lib/server/email';

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

const assignmentEventTime = (assignment: {
  assigned_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
}) => {
  const ts = [
    assignment.cancelled_at,
    assignment.completed_at,
    assignment.declined_at,
    assignment.accepted_at,
    assignment.assigned_at,
    assignment.created_at,
  ]
    .filter(Boolean)
    .map((value) => new Date(String(value)).getTime());

  return ts.length ? Math.max(...ts) : 0;
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
          'id, name, slug, description, base_price, duration_minutes, is_active, category_id',
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
              'id, service_id, name, description, type, price, duration_minutes, is_required, display_order, is_active',
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

    let serviceCategory: {
      id: string;
      name: string;
      slug: string | null;
      charge_type: string | null;
      is_active: boolean | null;
    } | null = null;

    if (service?.category_id) {
      const { data: category } = await supabaseAdmin
        .from('service_categories')
        .select('id, name, slug, charge_type, is_active')
        .eq('id', service.category_id)
        .single();
      serviceCategory = category || null;
    }

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
    const latestAssignment = assignments.reduce<AssignmentRow | null>(
      (latest, current) => {
        if (!latest) return current;
        return assignmentEventTime(current) > assignmentEventTime(latest)
          ? current
          : latest;
      },
      null,
    );

    let assignedWorkerName: string | null = null;
    let assignedWorkerEmail: string | null = null;
    let assignedWorkerPhone: string | null = null;

    if (latestAssignment?.worker_id) {
      const { data: worker } = await supabaseAdmin
        .from('workers')
        .select('id, profile_id')
        .eq('id', latestAssignment.worker_id)
        .single();

      if (worker?.profile_id) {
        const { data: workerProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email, phone')
          .eq('id', worker.profile_id)
          .single();

        assignedWorkerName = workerProfile?.full_name || null;
        assignedWorkerEmail = workerProfile?.email || null;
        assignedWorkerPhone = workerProfile?.phone || null;
      }
    }

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
          category: serviceCategory,
        }
      : null;

    return NextResponse.json({
      booking: {
        ...booking,
        customer_name: customer?.full_name || null,
        customer_email: customer?.email || null,
        customer_phone: customer?.phone || null,
        service_name: service?.name || null,
        service_category: serviceCategory?.name || null,
        service_details: serviceDetails,
        assigned_worker_id: latestAssignment?.worker_id || null,
        assigned_worker_name: assignedWorkerName,
        assigned_worker_email: assignedWorkerEmail,
        assigned_worker_phone: assignedWorkerPhone,
        assignment_status: latestAssignment?.status || null,
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

    if (
      typeof body.status === 'undefined' &&
      typeof body.payment_status === 'undefined' &&
      typeof body.worker_id === 'undefined' &&
      typeof body.assignment_status === 'undefined' &&
      !body.auto_assign
    ) {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 },
      );
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
    let assignmentStatusWorkerId: string | null = null;
    let shouldSendAssignmentAcceptedEmail = false;
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
      assignmentStatusWorkerId = targetWorkerId;
      if (!targetWorkerId) {
        return NextResponse.json(
          { error: 'No worker assignment found to update assignment status' },
          { status: 400 },
        );
      }

      const { data: existingTargetAssignment } = await supabaseAdmin
        .from('booking_assignments')
        .select('status')
        .eq('booking_id', id)
        .eq('worker_id', targetWorkerId)
        .maybeSingle();

      const previousTargetAssignmentStatus =
        String(existingTargetAssignment?.status || '').toLowerCase() || null;

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

      shouldSendAssignmentAcceptedEmail =
        body.assignment_status === 'accepted' &&
        previousTargetAssignmentStatus !== 'accepted';
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

    const getWorkerProfile = async (workerId: string) => {
      const { data: workerRow } = await supabaseAdmin
        .from('workers')
        .select('profile_id')
        .eq('id', workerId)
        .maybeSingle();

      if (!workerRow?.profile_id) return null;

      const { data: workerProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('id', workerRow.profile_id)
        .maybeSingle();

      return workerProfile || null;
    };

    const getServiceDetails = async (): Promise<any> => {
      const details: any = { name: serviceName };

      if (booking.service_id) {
        const { data: svcData } = await supabaseAdmin
          .from('services')
          .select('id, category_id')
          .eq('id', booking.service_id)
          .maybeSingle();

        if (svcData?.category_id) {
          const { data: catData } = await supabaseAdmin
            .from('service_categories')
            .select('name')
            .eq('id', svcData.category_id)
            .maybeSingle();
          details.category = catData?.name;
        }

        if (updatedBooking.selected_options?.length > 0) {
          const { data: optData } = await supabaseAdmin
            .from('service_options')
            .select('id, name, description, price')
            .in('id', updatedBooking.selected_options);
          details.options = (optData || []).map((opt: any) => ({
            name: opt.name,
            description: opt.description,
            price: opt.price,
          }));
        }

        if (updatedBooking.selected_variants?.length > 0) {
          const { data: varData } = await supabaseAdmin
            .from('service_requirements')
            .select('id, name, type, price')
            .in('id', updatedBooking.selected_variants);
          details.requirements = (varData || []).map((v: any) => ({
            name: v.name,
            type: v.type,
            price: v.price,
          }));
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

    if (shouldSendAssignmentAcceptedEmail && assignmentStatusWorkerId) {
      const acceptedWorkerProfile = await getWorkerProfile(
        assignmentStatusWorkerId,
      );

      if (customerProfile?.email) {
        try {
          // Fetch worker image from profiles table
          let workerImage: string | undefined = undefined;
          const { data: workerFullProfile } = await supabaseAdmin
            .from('workers')
            .select('profile_id')
            .eq('id', assignmentStatusWorkerId)
            .maybeSingle();

          if (workerFullProfile?.profile_id) {
            const { data: profileData } = await supabaseAdmin
              .from('profiles')
              .select('avatar_url')
              .eq('id', workerFullProfile.profile_id)
              .maybeSingle();

            if (profileData?.avatar_url) {
              workerImage = profileData.avatar_url;
            }
          }

          let workerDetails: any = {
            name: acceptedWorkerProfile?.full_name || 'Assigned Professional',
            image: workerImage,
          };

          await sendEmail({
            to: customerProfile.email,
            subject: `Professional Assigned - ${serviceSubject}`,
            html: bookingAssignmentAcceptedTemplate({
              customerName,
              bookingId: id,
              service: serviceDetailsForEmails,
              address: bookingAddressForEmails,
              unitOrFlat: unitOrFlatForEmails,
              notes: notesForEmails,
              bookingDate,
              bookingTime,
              worker: workerDetails,
            }),
          });
        } catch (emailError) {
          console.error('Booking accepted user email failed:', emailError);
        }
      }
    }

    if (didAssignWorker && assignedWorkerId) {
      const isPaidBooking =
        String(updatedBooking.payment_status || '') === 'paid';
      const assignedWorkerProfile = await getWorkerProfile(assignedWorkerId);

      if (isPaidBooking && assignedWorkerProfile?.email) {
        try {
          await sendEmail({
            to: assignedWorkerProfile.email,
            subject: `New Booking Assigned - ${serviceSubject}`,
            html: bookingAssignedToWorkerTemplate({
              workerName: assignedWorkerProfile.full_name || 'Worker',
              bookingId: id,
              service: serviceDetailsForEmails,
              address: bookingAddressForEmails,
              unitOrFlat: unitOrFlatForEmails,
              notes: notesForEmails,
              bookingDate,
              bookingTime,
              customerName,
            }),
          });
        } catch (emailError) {
          console.error('Booking assigned worker email failed:', emailError);
        }
      }
    }

    for (const cancelledWorkerId of cancelledWorkerIds) {
      const cancelledWorkerProfile = await getWorkerProfile(cancelledWorkerId);

      if (cancelledWorkerProfile?.email) {
        try {
          await sendEmail({
            to: cancelledWorkerProfile.email,
            subject: `Booking Assignment Cancelled - ${serviceSubject}`,
            html: bookingAssignmentCancelledTemplate({
              workerName: cancelledWorkerProfile.full_name || 'Worker',
              bookingId: id,
              service: serviceDetailsForEmails,
              address: bookingAddressForEmails,
              unitOrFlat: unitOrFlatForEmails,
              notes: notesForEmails,
              bookingDate,
              bookingTime,
            }),
          });
        } catch (emailError) {
          console.error(
            'Booking assignment cancelled email failed:',
            emailError,
          );
        }
      }
    }

    const updatedStatus = String(updatedBooking.status || 'pending');

    // Handle booking completion - send rating email instead of status update
    if (
      updatedStatus === 'completed' &&
      previousBookingStatus !== 'completed' &&
      customerProfile?.email
    ) {
      try {
        let workerNameForEmail = 'Assigned Professional';
        let workerImageForEmail: string | undefined;

        // Best-effort: prefer accepted assignment, fallback to latest assignment worker
        const { data: acceptedAssignment } = await supabaseAdmin
          .from('booking_assignments')
          .select('worker_id, assigned_at')
          .eq('booking_id', id)
          .eq('status', 'accepted')
          .order('assigned_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const workerIdForEmail =
          acceptedAssignment?.worker_id || latestAssignment?.worker_id || null;

        if (workerIdForEmail) {
          const { data: workerData } = await supabaseAdmin
            .from('workers')
            .select('profile_id, profiles(full_name, avatar_url)')
            .eq('id', workerIdForEmail)
            .maybeSingle();

          const workerProfile = workerData?.profiles?.[0];

          if (workerProfile?.full_name) {
            workerNameForEmail = workerProfile.full_name;
          }

          if (workerProfile?.avatar_url) {
            workerImageForEmail = workerProfile.avatar_url;
          }
        }

        const ratingLink = `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${id}?rate=true`;

        await sendEmail({
          to: customerProfile.email,
          subject: 'Booking Complete - Rate Your Professional',
          html: await bookingCompletionTemplate({
            userEmail: customerProfile.email,
            userName: customerName,
            bookingId: id,
            serviceName: serviceDetailsForEmails.name,
            serviceCategory: serviceDetailsForEmails.category,
            bookingDate,
            bookingTime,
            workerName: workerNameForEmail,
            workerImage: workerImageForEmail,
            ratingLink,
          }),
        });
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
