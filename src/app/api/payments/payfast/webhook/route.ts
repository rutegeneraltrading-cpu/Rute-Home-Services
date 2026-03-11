import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getPayFastService } from '@/lib/server/payfast/payfast.service';
import { sendEmail } from '@/lib/server/email/ses-mailer';
import { orderPaymentSuccessTemplate } from '@/lib/server/email';
import { bookingPaymentSuccessTemplate } from '@/lib/server/email';

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

    const { data: existingBooking, error: existingBookingError } =
      await supabase
        .from('bookings')
        .select(
          'id, total_price, payment_status, profiles!user_id(full_name, email)',
        )
        .eq('id', referenceId)
        .maybeSingle();

    if (existingBookingError) {
      console.error('Error fetching existing booking:', existingBookingError);
    }

    const bookingWasPaidBefore = existingBooking?.payment_status === 'paid';

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
      const bookingIsPaidNow = dbPaymentStatus === 'paid';

      if (bookingIsPaidNow && !bookingWasPaidBefore && existingBooking) {
        const profile = Array.isArray(existingBooking.profiles)
          ? existingBooking.profiles[0]
          : existingBooking.profiles;

        const customerName = profile?.full_name || 'Customer';
        const customerEmail = profile?.email || null;
        const adminEmail =
          process.env.ADMIN_BOOKING_EMAIL ||
          process.env.AWS_SES_FROM_EMAIL ||
          '';
        const paidAt = new Date().toLocaleString('en-ZA', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        if (customerEmail) {
          try {
            await sendEmail({
              to: customerEmail,
              subject: `Payment Successful - Booking ${referenceId}`,
              html: bookingPaymentSuccessTemplate({
                audience: 'user',
                customerName,
                bookingId: referenceId,
                total: Number(existingBooking.total_price || 0),
                transactionId,
                paidAt,
                detailsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${referenceId}`,
              }),
            });
          } catch (emailError) {
            console.error(
              'Booking payment success user email failed:',
              emailError,
            );
          }
        }

        if (adminEmail) {
          try {
            await sendEmail({
              to: adminEmail,
              subject: `Booking Payment Received - ${referenceId}`,
              html: bookingPaymentSuccessTemplate({
                audience: 'admin',
                customerName,
                bookingId: referenceId,
                total: Number(existingBooking.total_price || 0),
                transactionId,
                paidAt,
                detailsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings`,
              }),
            });
          } catch (emailError) {
            console.error(
              'Booking payment success admin email failed:',
              emailError,
            );
          }
        }
      }

      return NextResponse.json(
        { success: true, message: 'Booking webhook processed' },
        { status: 200 },
      );
    }

    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select('id, total, payment_status, profiles!user_id(full_name, email)')
      .eq('id', referenceId)
      .maybeSingle();

    if (existingOrderError) {
      console.error('Error fetching existing order:', existingOrderError);
    }

    const wasPaidBefore = existingOrder?.payment_status === 'paid';

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

    const isPaidNow = dbPaymentStatus === 'paid';

    if (isPaidNow && !wasPaidBefore && existingOrder) {
      const profile = Array.isArray(existingOrder.profiles)
        ? existingOrder.profiles[0]
        : existingOrder.profiles;

      const customerName = profile?.full_name || 'Customer';
      const customerEmail = profile?.email || null;
      const adminEmail =
        process.env.ADMIN_ORDER_EMAIL || process.env.AWS_SES_FROM_EMAIL || '';
      const paidAt = new Date().toLocaleString('en-ZA', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      if (customerEmail) {
        try {
          await sendEmail({
            to: customerEmail,
            subject: `Payment Successful - Order ${referenceId}`,
            html: orderPaymentSuccessTemplate({
              audience: 'user',
              customerName,
              orderId: referenceId,
              total: Number(existingOrder.total || 0),
              transactionId,
              paidAt,
              detailsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/orders/${referenceId}`,
            }),
          });
        } catch (emailError) {
          console.error('Order payment success user email failed:', emailError);
        }
      }

      if (adminEmail) {
        try {
          await sendEmail({
            to: adminEmail,
            subject: `Order Payment Received - ${referenceId}`,
            html: orderPaymentSuccessTemplate({
              audience: 'admin',
              customerName,
              orderId: referenceId,
              total: Number(existingOrder.total || 0),
              transactionId,
              paidAt,
              detailsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${referenceId}`,
            }),
          });
        } catch (emailError) {
          console.error(
            'Order payment success admin email failed:',
            emailError,
          );
        }
      }
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
