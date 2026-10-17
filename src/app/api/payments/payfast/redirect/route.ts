import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getPayFastService } from '@/lib/server/payfast/payfast.service';

interface PaymentRedirectRequest {
  booking_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  service_name: string;
  service_description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRedirectRequest = await request.json();
    const {
      booking_id,
      first_name,
      last_name,
      email,
      phone,
      service_name,
      service_description,
    } = body;

    // Validate required fields
    if (!booking_id || !first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // The amount charged must always come from the booking record created
    // server-side at booking time — never from the client, which could send
    // any amount it likes for a real booking_id (e.g. R1 for a R500 booking).
    const adminClient = await createAdminClient();
    const { data: booking, error: bookingError } = await adminClient
      .from('bookings')
      .select('id, user_id, total_price')
      .eq('id', booking_id)
      .eq('user_id', profile.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    try {
      // Initialize PayFast service
      const payfast = getPayFastService();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;

      // Build payment data
      const paymentData = payfast.buildPaymentData(
        booking_id,
        Number(booking.total_price),
        first_name,
        last_name,
        email,
        phone,
        service_description
          ? `${service_name} - ${service_description}`
          : `${service_name} - Home Service`,
        {
          returnUrl: `${appUrl}/success?booking=${booking_id}`,
          cancelUrl: `${appUrl}/cancelled?booking=${booking_id}`,
        },
      );

      // Generate payment URL
      const paymentUrl = payfast.generatePaymentUrl(paymentData);

      return NextResponse.json({ payment_url: paymentUrl }, { status: 200 });
    } catch (payfastError) {
      console.error('PayFast error:', payfastError);
      return NextResponse.json(
        { error: 'Failed to generate payment URL' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error creating payment redirect:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 },
    );
  }
}
