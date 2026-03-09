import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPayFastService } from '@/lib/server/payfast/payfast.service';

interface OrderPaymentRedirectRequest {
  order_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  total: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body: OrderPaymentRedirectRequest = await request.json();
    const { order_id, user_id, total, first_name, last_name, email, phone } =
      body;

    if (!order_id || !user_id || !first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total')
      .eq('id', order_id)
      .eq('user_id', user_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const payfast = getPayFastService();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const paymentData = payfast.buildPaymentData(
      order_id,
      Number.isFinite(total) ? total : Number(order.total),
      first_name,
      last_name,
      email,
      phone,
      `Order #${order_id.slice(0, 8)}`,
      {
        returnUrl: `${appUrl}/success?order=${order_id}`,
        cancelUrl: `${appUrl}/cancelled?order=${order_id}`,
      },
    );

    const paymentUrl = payfast.generatePaymentUrl(paymentData);

    return NextResponse.json({ payment_url: paymentUrl }, { status: 200 });
  } catch (error) {
    console.error('Error creating order payment redirect:', error);
    return NextResponse.json(
      { error: 'Failed to create order payment' },
      { status: 500 },
    );
  }
}
