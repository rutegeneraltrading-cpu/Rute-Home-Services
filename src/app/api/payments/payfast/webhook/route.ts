import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getPayFastService } from '@/lib/server/payfast/payfast.service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const skipSignatureValidation =
      process.env.PAYFAST_SKIP_SIGNATURE_VALIDATION === 'true' &&
      process.env.NODE_ENV !== 'production';

    // Get raw body for signature validation
    const text = await request.text();
    const webhookData = Object.fromEntries(new URLSearchParams(text));

    const referenceId = webhookData.m_payment_id || webhookData.custom_str1;

    // Validate webhook signature
    const payfast = getPayFastService();
    const isValid = payfast.validateWebhookSignature(webhookData, text);

    if (!isValid && !skipSignatureValidation) {
      console.error('Invalid PayFast webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (!referenceId) {
      return NextResponse.json(
        { error: 'Reference ID not found in webhook' },
        { status: 400 },
      );
    }

    // Get payment status
    const paymentStatus = String(
      webhookData.payment_status || '',
    ).toUpperCase();
    const transactionId = webhookData.pf_payment_id;

    let bookingStatus = 'pending';
    let orderStatus = 'pending';
    let dbPaymentStatus = 'failed';

    // Determine status based on PayFast payment_status
    if (paymentStatus === 'COMPLETE') {
      // Payment successful
      dbPaymentStatus = 'paid';
      bookingStatus = 'confirmed';
      orderStatus = 'confirmed';
    } else if (paymentStatus === 'PENDING') {
      // Payment pending (process ongoing)
      dbPaymentStatus = 'pending';
    } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
      // Payment cancelled or failed
      dbPaymentStatus = 'failed';
      bookingStatus = 'cancelled';
      orderStatus = 'cancelled';
    }

    // Update booking with payment information
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: dbPaymentStatus,
        status: bookingStatus,
        payfast_transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', referenceId)
      .select('id, status, payment_status, payfast_transaction_id')
      .maybeSingle();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 },
      );
    }

    if (updatedBooking) {
      return NextResponse.json(
        { success: true, message: 'Booking webhook processed' },
        { status: 200 },
      );
    }

    const { data: updatedOrder, error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        payment_status: dbPaymentStatus,
        status: orderStatus,
        payfast_transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', referenceId)
      .select('id, status, payment_status, payfast_transaction_id')
      .maybeSingle();

    if (orderUpdateError) {
      console.error('Error updating order:', orderUpdateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 },
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'No booking/order found for provided reference id' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: 'Order webhook processed' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error processing PayFast webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 },
    );
  }
}
