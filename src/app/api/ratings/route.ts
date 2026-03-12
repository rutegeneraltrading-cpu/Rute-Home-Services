import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/server/email/ses-mailer';
import { workerRatingReceivedTemplate } from '@/lib/server/email';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, rating, review } = await req.json();

    // Validation
    if (!bookingId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, rating' },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', userData.user.id)
      .maybeSingle();

    if (!profile?.id) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 },
      );
    }

    // Get booking details to verify owner
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, user_id, status, service_id, booking_date, booking_time')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user is the booking owner
    if (booking.user_id !== profile.id) {
      return NextResponse.json(
        { error: 'Unauthorized: This is not your booking' },
        { status: 403 },
      );
    }

    // Verify booking is completed
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only rate completed bookings' },
        { status: 400 },
      );
    }

    // Get worker_id from accepted assignment (fallback to latest assignment)
    const { data: acceptedAssignment } = await supabaseAdmin
      .from('booking_assignments')
      .select('worker_id, assigned_at')
      .eq('booking_id', bookingId)
      .eq('status', 'accepted')
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: latestAssignment } = await supabaseAdmin
      .from('booking_assignments')
      .select('worker_id, assigned_at')
      .eq('booking_id', bookingId)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const workerId =
      acceptedAssignment?.worker_id || latestAssignment?.worker_id;

    if (!workerId) {
      return NextResponse.json(
        { error: 'No assigned worker found for this booking' },
        { status: 400 },
      );
    }

    // Mark assignment completed when rating is submitted
    const nowIso = new Date().toISOString();
    const { error: completeAssignmentError } = await supabaseAdmin
      .from('booking_assignments')
      .update({
        status: 'completed',
        completed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('booking_id', bookingId)
      .eq('worker_id', workerId)
      .in('status', ['accepted', 'pending']);

    if (completeAssignmentError) {
      return NextResponse.json(
        { error: 'Failed to update booking assignment status' },
        { status: 500 },
      );
    }

    const [{ data: worker }, { data: service }] = await Promise.all([
      supabaseAdmin
        .from('workers')
        .select('id, profile_id')
        .eq('id', workerId)
        .maybeSingle(),
      booking.service_id
        ? supabaseAdmin
            .from('services')
            .select('id, name, category_id')
            .eq('id', booking.service_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const [{ data: workerProfile }, { data: serviceCategory }] =
      await Promise.all([
        worker?.profile_id
          ? supabaseAdmin
              .from('profiles')
              .select('full_name, email')
              .eq('id', worker.profile_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        service?.category_id
          ? supabaseAdmin
              .from('service_categories')
              .select('name')
              .eq('id', service.category_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

    // Check if rating already exists
    const { data: existingRating } = await supabaseAdmin
      .from('booking_ratings')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (existingRating) {
      // Update existing rating
      const { data: updatedRating, error: updateError } = await supabaseAdmin
        .from('booking_ratings')
        .update({
          rating,
          review: review || null,
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update rating' },
          { status: 500 },
        );
      }

      if (workerProfile?.email) {
        try {
          await sendEmail({
            to: workerProfile.email,
            subject: `Great job! You received an updated ${rating}-star rating`,
            html: workerRatingReceivedTemplate({
              workerName: workerProfile.full_name || 'Professional',
              bookingId,
              serviceName: service?.name || 'Service Booking',
              serviceCategory: serviceCategory?.name || undefined,
              bookingDate: booking.booking_date || undefined,
              bookingTime: booking.booking_time || undefined,
              rating,
              review: review || undefined,
            }),
          });
        } catch (workerEmailError) {
          console.error(
            'Worker rating notification email failed on update:',
            workerEmailError,
          );
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Rating updated successfully',
          rating: updatedRating,
        },
        { status: 200 },
      );
    }

    // Create new rating
    const { data: newRating, error: insertError } = await supabaseAdmin
      .from('booking_ratings')
      .insert({
        booking_id: bookingId,
        worker_id: workerId,
        user_id: profile.id,
        rating,
        review: review || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Rating insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 },
      );
    }

    if (workerProfile?.email) {
      try {
        await sendEmail({
          to: workerProfile.email,
          subject: `Great job! You received a ${rating}-star rating`,
          html: workerRatingReceivedTemplate({
            workerName: workerProfile.full_name || 'Professional',
            bookingId,
            serviceName: service?.name || 'Service Booking',
            serviceCategory: serviceCategory?.name || undefined,
            bookingDate: booking.booking_date || undefined,
            bookingTime: booking.booking_time || undefined,
            rating,
            review: review || undefined,
          }),
        });
      } catch (workerEmailError) {
        console.error(
          'Worker rating notification email failed:',
          workerEmailError,
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Rating saved successfully',
        rating: newRating,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Rating API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
