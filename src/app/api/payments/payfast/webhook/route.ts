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

    const bookingId = webhookData.m_payment_id || webhookData.custom_str1;

    // Validate webhook signature
    const payfast = getPayFastService();
    const isValid = payfast.validateWebhookSignature(webhookData, text);

    if (!isValid && !skipSignatureValidation) {
      console.error('Invalid PayFast webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID not found in webhook' },
        { status: 400 },
      );
    }

    // Get payment status
    const paymentStatus = String(
      webhookData.payment_status || '',
    ).toUpperCase();
    const transactionId = webhookData.pf_payment_id;

    let bookingStatus = 'pending';
    let dbPaymentStatus = 'failed';

    // Determine status based on PayFast payment_status
    if (paymentStatus === 'COMPLETE') {
      // Payment successful
      dbPaymentStatus = 'paid';
      bookingStatus = 'confirmed';
    } else if (paymentStatus === 'PENDING') {
      // Payment pending (process ongoing)
      dbPaymentStatus = 'pending';
    } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
      // Payment cancelled or failed
      dbPaymentStatus = 'failed';
      bookingStatus = 'cancelled';
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
      .eq('id', bookingId)
      .select('id, status, payment_status, payfast_transaction_id')
      .maybeSingle();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 },
      );
    }

    if (!updatedBooking) {
      console.error('Booking not found during update:', bookingId);
      return NextResponse.json(
        { error: 'Booking not found for update' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: 'Webhook processed' },
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
