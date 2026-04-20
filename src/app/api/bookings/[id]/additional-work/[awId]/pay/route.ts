import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getPayFastService } from '@/lib/server/payfast/payfast.service';

interface Params {
  params: Promise<{ id: string; awId: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id: bookingId, awId } = await params;

    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('auth_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify booking belongs to user
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, services(name)')
      .eq('id', bookingId)
      .eq('user_id', profile.id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Fetch additional work — must be pending_payment
    const { data: additionalWork } = await supabaseAdmin
      .from('booking_additional_works')
      .select('id, fee, description, status')
      .eq('id', awId)
      .eq('booking_id', bookingId)
      .single();

    if (!additionalWork) {
      return NextResponse.json(
        { error: 'Additional work not found' },
        { status: 404 },
      );
    }

    if (additionalWork.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'This additional work is not pending payment' },
        { status: 422 },
      );
    }

    const payfast = getPayFastService();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const fullName = profile.full_name || 'Customer';
    const [firstName, ...lastParts] = fullName.split(' ');
    const lastName = lastParts.join(' ') || 'User';

    const serviceName =
      (Array.isArray(booking.services)
        ? booking.services[0]?.name
        : (booking.services as any)?.name) || 'Service Booking';

    const paymentData = payfast.buildPaymentData(
      additionalWork.id,
      Number(additionalWork.fee),
      firstName || 'Customer',
      lastName,
      profile.email,
      profile.phone || undefined,
      `Additional Work - ${serviceName}`,
      {
        returnUrl: `${appUrl}/success?booking=${bookingId}&additional_work=${additionalWork.id}`,
        cancelUrl: `${appUrl}/cancelled?booking=${bookingId}`,
      },
    );

    const paymentUrl = payfast.generatePaymentUrl(paymentData);

    return NextResponse.json({ payment_url: paymentUrl });
  } catch (error) {
    console.error('Error generating additional work payment URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
