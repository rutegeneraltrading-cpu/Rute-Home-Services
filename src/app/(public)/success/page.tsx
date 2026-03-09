'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ArrowRight,
  Package,
  CalendarCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useCart } from '@/lib/contexts';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const orderId = searchParams.get('order');
  const bookingId = searchParams.get('booking');

  const paymentType = useMemo(() => {
    if (orderId && !bookingId && UUID_REGEX.test(orderId)) return 'order';
    if (bookingId && !orderId && UUID_REGEX.test(bookingId)) return 'booking';
    return 'invalid';
  }, [bookingId, orderId]);

  useEffect(() => {
    if (paymentType === 'invalid') {
      router.replace('/');
      return;
    }

    if (paymentType === 'order') {
      clearCart();
    }
  }, [clearCart, paymentType, router]);

  if (paymentType === 'invalid') {
    return null;
  }

  const id = paymentType === 'order' ? orderId : bookingId;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle2 className="h-20 w-20 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">
            Payment Successful
          </h1>
          <p className="mt-3 text-slate-600 text-lg">
            {paymentType === 'order'
              ? 'Your order has been confirmed and payment received.'
              : 'Your booking payment is completed successfully.'}
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            {paymentType === 'order' ? (
              <Package className="h-4 w-4" />
            ) : (
              <CalendarCheck2 className="h-4 w-4" />
            )}
            <span>
              {paymentType === 'order' ? 'Order ID:' : 'Booking ID:'}{' '}
              <span className="font-mono font-semibold text-slate-900">
                {id?.slice(0, 8)}
              </span>
            </span>
          </div>
        </div>

        <div className="space-y-3 text-left bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            What happens next?
          </h3>
          {paymentType === 'order' ? (
            <ul className="text-sm text-blue-800 space-y-2 ml-6 list-disc">
              <li>You&apos;ll receive an order confirmation email shortly</li>
              <li>Your order will be processed and prepared for delivery</li>
              <li>Track your order status in your dashboard</li>
            </ul>
          ) : (
            <ul className="text-sm text-blue-800 space-y-2 ml-6 list-disc">
              <li>Your booking has been confirmed</li>
              <li>You&apos;ll receive booking details via email</li>
              <li>Track your booking status in your dashboard</li>
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
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href={paymentType === 'order' ? '/shop' : '/services'}>
              {paymentType === 'order'
                ? 'Continue Shopping'
                : 'Book Another Service'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
