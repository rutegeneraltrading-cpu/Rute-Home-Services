import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendResendEmail } from '@/lib/server/email';
import { bookingUpdatedByCustomerTemplate } from '@/lib/server/email';

const EDIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

interface Params {
  params: Promise<{ id: string }>;
}

interface CustomerUpdatePayload {
  notes?: string;
  address?: string;
  unit_or_flat?: string;
  booking_date?: string;
  booking_time?: string;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body: CustomerUpdatePayload = await request.json();

    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 },
      );
    }

    // Fetch the booking (must belong to this user)
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(
        'id, user_id, service_id, address, unit_or_flat, notes, booking_date, booking_time, total_duration, status, payment_status, created_at',
      )
      .eq('id', id)
      .eq('user_id', profile.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check 1-hour edit window
    const createdAt = new Date(booking.created_at).getTime();
    const now = Date.now();
    if (now - createdAt > EDIT_WINDOW_MS) {
      return NextResponse.json(
        {
          error:
            'Edit window has expired. Bookings can only be edited within 1 hour of creation.',
        },
        { status: 403 },
      );
    }

    // Cannot edit completed or cancelled bookings
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return NextResponse.json(
        { error: `Cannot edit a booking with status: ${booking.status}` },
        { status: 403 },
      );
    }

    // Validate at least one field is being updated
    const hasAnyField =
      typeof body.notes !== 'undefined' ||
      typeof body.address !== 'undefined' ||
      typeof body.unit_or_flat !== 'undefined' ||
      typeof body.booking_date !== 'undefined' ||
      typeof body.booking_time !== 'undefined';

    if (!hasAnyField) {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 },
      );
    }

    const newDate = body.booking_date ?? booking.booking_date;
    const newTime = body.booking_time ?? booking.booking_time;
    const isScheduleChanging =
      (body.booking_date && body.booking_date !== booking.booking_date) ||
      (body.booking_time && body.booking_time !== booking.booking_time);

    // If date or time is changing, verify availability
    if (isScheduleChanging) {
      // Find the currently active worker assignment (pending or accepted)
      const { data: activeAssignment } = await supabaseAdmin
        .from('booking_assignments')
        .select('worker_id, status')
        .eq('booking_id', id)
        .in('status', ['pending', 'accepted'])
        .order('assigned_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const assignedWorkerId = activeAssignment?.worker_id || null;

      if (assignedWorkerId) {
        // Worker is assigned — verify ONLY this worker is available for the new slot
        const { data: availableWorkers, error: availabilityError } =
          await supabaseAdmin.rpc('get_available_workers_for_booking', {
            p_service_id: booking.service_id,
            p_booking_date: newDate,
            p_booking_time: newTime,
            p_duration_minutes: booking.total_duration,
          });

        if (availabilityError) {
          return NextResponse.json(
            { error: 'Failed to check worker availability' },
            { status: 500 },
          );
        }

        const workerAvailable = (
          (availableWorkers as Array<{ worker_id: string }>) || []
        ).some((w) => w.worker_id === assignedWorkerId);

        if (!workerAvailable) {
          return NextResponse.json(
            {
              error:
                'Your assigned worker is not available for the selected date and time. Please choose a different slot.',
            },
            { status: 409 },
          );
        }
      } else {
        // No worker assigned — verify at least one worker is available
        const { data: slotsData, error: slotsError } = await supabaseAdmin.rpc(
          'get_available_slots_for_service',
          {
            p_service_id: booking.service_id,
            p_booking_date: newDate,
            p_duration_minutes: booking.total_duration,
          },
        );

        if (slotsError) {
          return NextResponse.json(
            { error: 'Failed to check availability' },
            { status: 500 },
          );
        }

        const result = slotsData as {
          available_slots: string[];
        } | null;

        const availableSlots = result?.available_slots || [];
        if (!availableSlots.includes(newTime)) {
          return NextResponse.json(
            {
              error:
                'No workers are available for the selected date and time. Please choose a different slot.',
            },
            { status: 409 },
          );
        }
      }
    }

    // Build the update payload (only changed fields)
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.notes !== 'undefined') {
      updatePayload.notes = body.notes?.trim() || null;
    }
    if (typeof body.address !== 'undefined' && body.address) {
      updatePayload.address = body.address.trim();
    }
    if (typeof body.unit_or_flat !== 'undefined') {
      updatePayload.unit_or_flat = body.unit_or_flat?.trim() || null;
    }
    if (body.booking_date) {
      updatePayload.booking_date = body.booking_date;
    }
    if (body.booking_time) {
      updatePayload.booking_time = body.booking_time;
    }

    // Persist the update
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

    // Fetch updated booking
    const { data: updatedBooking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    // ── Email notifications ──────────────────────────────────────────────────

    // Fetch service & category info for emails
    const { data: serviceData } = await supabaseAdmin
      .from('services')
      .select('id, name, category_id')
      .eq('id', booking.service_id)
      .maybeSingle();

    let serviceCategoryName: string | undefined;
    if (serviceData?.category_id) {
      const { data: catData } = await supabaseAdmin
        .from('service_categories')
        .select('name')
        .eq('id', serviceData.category_id)
        .maybeSingle();
      serviceCategoryName = catData?.name;
    }

    const serviceDetail = {
      name: serviceData?.name || 'Service',
      category: serviceCategoryName,
    };

    const customerName = profile.full_name || 'Customer';
    const updatedAt = new Date().toLocaleString('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const currentValues = {
      address: String(updatePayload.address ?? booking.address ?? ''),
      unitOrFlat: updatePayload.unit_or_flat
        ? String(updatePayload.unit_or_flat)
        : undefined,
      notes: updatePayload.notes ? String(updatePayload.notes) : undefined,
      bookingDate: String(updatePayload.booking_date ?? booking.booking_date),
      bookingTime: String(updatePayload.booking_time ?? booking.booking_time),
    };

    const serviceName = serviceDetail.name;
    const serviceCategory = serviceDetail.category;
    const emailSubject = `Booking Updated by Customer — ${serviceName}${serviceCategory ? ` (${serviceCategory})` : ''}`;

    // Find active assignment to decide who to notify
    const { data: currentActiveAssignment } = await supabaseAdmin
      .from('booking_assignments')
      .select('worker_id, status')
      .eq('booking_id', id)
      .in('status', ['pending', 'accepted'])
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Send email to admin
    const adminEmail =
      process.env.ADMIN_BOOKING_EMAIL || process.env.AWS_SES_FROM_EMAIL;

    if (adminEmail) {
      try {
        await sendResendEmail({
          to: adminEmail,
          subject: emailSubject,
          html: bookingUpdatedByCustomerTemplate({
            recipientName: 'Admin',
            customerName,
            bookingId: id,
            service: serviceDetail,
            ...currentValues,
            audience: 'admin',
            updatedAt,
          }),
        });
      } catch (emailError) {
        console.error('Booking updated admin email failed:', emailError);
      }
    }

    // Send email to assigned worker (if any)
    if (currentActiveAssignment?.worker_id) {
      try {
        const { data: workerRow } = await supabaseAdmin
          .from('workers')
          .select('profile_id')
          .eq('id', currentActiveAssignment.worker_id)
          .maybeSingle();

        if (workerRow?.profile_id) {
          const { data: workerProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('id', workerRow.profile_id)
            .maybeSingle();

          if (workerProfile?.email) {
            await sendResendEmail({
              to: workerProfile.email,
              subject: emailSubject,
              html: bookingUpdatedByCustomerTemplate({
                recipientName: workerProfile.full_name || 'Worker',
                customerName,
                bookingId: id,
                service: serviceDetail,
                ...currentValues,
                audience: 'worker',
                updatedAt,
              }),
            });
          }
        }
      } catch (emailError) {
        console.error('Booking updated worker email failed:', emailError);
      }
    }

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error('Customer update booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
