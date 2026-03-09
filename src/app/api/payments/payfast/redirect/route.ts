import { NextRequest, NextResponse } from 'next/server';
import { getPayFastService } from '@/lib/server/payfast/payfast.service';

interface PaymentRedirectRequest {
  booking_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_price: number;
  phone?: string;
  service_name: string;
  service_description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRedirectRequest = await request.json();
    const {
      booking_id,
      user_id,
      total_price,
      first_name,
      last_name,
      email,
      phone,
      service_name,
      service_description,
    } = body;

    // Validate required fields
    if (!booking_id || !user_id || !first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    try {
      // Initialize PayFast service
      const payfast = getPayFastService();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;

      // Build payment data
      const paymentData = payfast.buildPaymentData(
        booking_id,
        total_price,
        first_name,
        last_name,
        email,
        phone,
        `${service_name}${service_description ? ` - ${service_description}` : 'Home Service'}`,
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
