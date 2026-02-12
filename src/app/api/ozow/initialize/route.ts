import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Ozow API credentials (should be in environment variables)
const OZOW_SITE_CODE = process.env.OZOW_SITE_CODE || '';
const OZOW_PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY || '';
const OZOW_IS_TEST = process.env.OZOW_IS_TEST === 'true';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { order_id, amount } = body;

    if (!order_id || !amount) {
      return NextResponse.json(
        { error: 'Order ID and amount are required' },
        { status: 400 },
      );
    }

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', user.id)
      .single();

    // Generate transaction reference
    const transactionReference = `ORDER-${order_id}-${Date.now()}`;

    // Ozow payment request parameters
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const ozowParams = {
      SiteCode: OZOW_SITE_CODE,
      CountryCode: 'ZA',
      CurrencyCode: 'ZAR',
      Amount: parseFloat(amount).toFixed(2),
      TransactionReference: transactionReference,
      BankReference: `Order #${order_id}`,
      Customer: profile?.name || profile?.email || user.email || '',
      CancelUrl: `${baseUrl}/checkout?status=cancelled`,
      ErrorUrl: `${baseUrl}/checkout?status=error`,
      SuccessUrl: `${baseUrl}/checkout?status=success&order=${order_id}`,
      NotifyUrl: `${baseUrl}/api/ozow/notify`,
      IsTest: OZOW_IS_TEST,
    };

    // Generate hash check for security
    const hashString = Object.values(ozowParams).join('').toLowerCase();
    const hashCheck = crypto
      .createHash('sha512')
      .update(hashString + OZOW_PRIVATE_KEY.toLowerCase())
      .digest('hex');

    // Ozow payment URL
    const ozowUrl = OZOW_IS_TEST
      ? 'https://pay.ozow.com'
      : 'https://pay.ozow.com';

    // Build Ozow redirect URL with parameters
    const queryParams = new URLSearchParams({
      ...ozowParams,
      IsTest: String(ozowParams.IsTest),
      HashCheck: hashCheck,
    });

    const paymentUrl = `${ozowUrl}?${queryParams.toString()}`;

    // Update order with transaction reference
    await supabase
      .from('orders')
      .update({
        transaction_reference: transactionReference,
        payment_status: 'pending',
      })
      .eq('id', order_id);

    return NextResponse.json({
      success: true,
      payment_url: paymentUrl,
      transaction_reference: transactionReference,
    });
  } catch (error) {
    console.error('Ozow initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 },
    );
  }
}
