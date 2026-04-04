'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, AlertCircle, ShoppingCart, CalendarX2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useGetBooking } from '@/lib/client/api/bookings/bookings.query';
import { useGetOrder } from '@/lib/client/api/orders/orders.query';
import { usePayFastPayment } from '@/lib/client/api/bookings/payments.mutation';
import { useOrderPayFastPayment } from '@/lib/client/api/orders/orders.mutation';
import { useGetProfile } from '@/lib/client/api/profile/profile.query';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CancelledView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: profile } = useGetProfile();

  const orderId = searchParams.get('order');
  const bookingId = searchParams.get('booking');

  const { data: booking } = useGetBooking(bookingId || '');
  const { data: order } = useGetOrder(orderId || '');
  const bookingPaymentMutation = usePayFastPayment();
  const orderPaymentMutation = useOrderPayFastPayment();

  const paymentType = useMemo(() => {
    if (orderId && !bookingId && UUID_REGEX.test(orderId)) return 'order';
    if (bookingId && !orderId && UUID_REGEX.test(bookingId)) return 'booking';
    return 'invalid';
  }, [bookingId, orderId]);

  useEffect(() => {
    if (paymentType === 'invalid') {
      router.replace('/');
    }
  }, [paymentType, router]);

  if (paymentType === 'invalid') {
    return null;
  }

  const id = paymentType === 'order' ? orderId : bookingId;

  const isRetrying =
    paymentType === 'order'
      ? orderPaymentMutation.isPending
      : bookingPaymentMutation.isPending;

  const canRetryPayment = paymentType === 'order' ? !!order : !!booking;

  const handleRetryPayment = async () => {
    if (paymentType === 'order') {
      if (!order) return;

      const fullName = profile?.full_name || 'Customer User';
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ') || 'User';

      await orderPaymentMutation.mutateAsync({
        order_id: order.id,
        user_id: order.user_id,
        first_name: firstName || 'Customer',
        last_name: lastName,
        email: profile?.email || order.profile?.email || '',
        phone: profile?.phone || order.profile?.phone || undefined,
        total: Number(order.total || 0),
      });

      return;
    }

    if (!booking) return;

    const fullName = profile?.full_name || booking.customer_name || 'Customer';
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || 'User';

    await bookingPaymentMutation.mutateAsync({
      booking_id: booking.id,
      user_id: booking.user_id,
      first_name: firstName || 'Customer',
      last_name: lastName,
      email: booking.customer_email || profile?.email || '',
      phone: booking.customer_phone || profile?.phone || undefined,
      total_price: Number(booking.total_price || 0),
      service_name:
        booking.service_name ||
        booking.service_details?.name ||
        'Service Booking',
      service_description: booking.service_details?.description || '',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <XCircle className="h-20 w-20 text-rose-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">
            Payment Cancelled
          </h1>
          <p className="mt-3 text-slate-600 text-lg">
            {paymentType === 'order'
              ? 'Your payment was cancelled. No charges were made to your account.'
              : 'Your booking payment was cancelled. You can try again anytime.'}
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            {paymentType === 'order' ? (
              <ShoppingCart className="h-4 w-4" />
            ) : (
              <CalendarX2 className="h-4 w-4" />
            )}
            <span>
              {paymentType === 'order' ? 'Order ID:' : 'Booking ID:'}{' '}
              <span className="font-mono font-semibold text-slate-900">
                {id?.slice(0, 8)}
              </span>
            </span>
          </div>
        </div>

        <div className="space-y-3 text-left bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-amber-900 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            What should I do?
          </h3>
          {paymentType === 'order' ? (
            <ul className="text-sm text-amber-800 space-y-2 ml-6 list-disc">
              <li>Your order is still pending payment</li>
              <li>You can retry payment from your orders page</li>
              <li>Cart items are still available for checkout</li>
            </ul>
          ) : (
            <ul className="text-sm text-amber-800 space-y-2 ml-6 list-disc">
              <li>Your booking is not paid yet</li>
              <li>You can retry payment from your bookings page</li>
              <li>Contact support if payment keeps failing</li>
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link
              href={paymentType === 'order' ? '/user/orders' : '/user/bookings'}
            >
              {paymentType === 'order' ? 'View My Orders' : 'View My Bookings'}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleRetryPayment}
            disabled={!canRetryPayment || isRetrying}
          >
            {isRetrying
              ? 'Processing...'
              : paymentType === 'order'
                ? 'Try Again & Pay Now'
                : 'Try Again & Pay Now'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CancelledView;
