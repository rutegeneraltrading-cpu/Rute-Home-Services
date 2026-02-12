import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const OZOW_PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      SiteCode,
      TransactionId,
      TransactionReference,
      Amount,
      Status,
      Optional1,
      Optional2,
      Optional3,
      Optional4,
      Optional5,
      CurrencyCode,
      IsTest,
      StatusMessage,
      Hash,
    } = body;

    // Verify hash for security
    const inputString =
      (SiteCode || '') +
      (TransactionId || '') +
      (TransactionReference || '') +
      (Amount || '') +
      (Status || '') +
      (Optional1 || '') +
      (Optional2 || '') +
      (Optional3 || '') +
      (Optional4 || '') +
      (Optional5 || '') +
      (CurrencyCode || '') +
      (IsTest || '') +
      (StatusMessage || '');

    const calculatedHash = crypto
      .createHash('sha512')
      .update(inputString.toLowerCase() + OZOW_PRIVATE_KEY.toLowerCase())
      .digest('hex');

    if (calculatedHash !== Hash?.toLowerCase()) {
      console.error('Invalid hash - possible fraud attempt');
      return NextResponse.json({ error: 'Invalid hash' }, { status: 400 });
    }

    const supabase = await createClient();

    // Extract order ID from transaction reference
    const orderIdMatch = TransactionReference?.match(/ORDER-([a-f0-9-]+)-/);
    const orderId = orderIdMatch ? orderIdMatch[1] : null;

    if (!orderId) {
      console.error('Invalid transaction reference');
      return NextResponse.json(
        { error: 'Invalid transaction reference' },
        { status: 400 },
      );
    }

    // Update order based on payment status
    let orderStatus = 'pending';
    let paymentStatus = 'pending';

    if (Status === 'Complete') {
      orderStatus = 'confirmed';
      paymentStatus = 'paid';
    } else if (Status === 'Cancelled' || Status === 'Abandoned') {
      orderStatus = 'cancelled';
      paymentStatus = 'cancelled';
    } else if (Status === 'Error') {
      orderStatus = 'failed';
      paymentStatus = 'failed';
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_status: paymentStatus,
        transaction_id: TransactionId,
        payment_response: JSON.stringify(body),
      })
      .eq('id', orderId);

    if (error) {
      console.error('Failed to update order:', error);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 },
      );
    }

    console.log(`Order ${orderId} updated to ${orderStatus}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ozow notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
