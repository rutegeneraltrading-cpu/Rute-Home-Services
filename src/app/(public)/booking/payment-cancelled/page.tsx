import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui';

const BookingPaymentCancelledPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
        <XCircle className="h-16 w-16 text-rose-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Payment Cancelled</h1>
        <p className="mt-2 text-slate-600">
          Your payment was cancelled. You can retry your booking payment.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button asChild>
            <Link href="/booking">Try Again</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/services">Back to Services</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingPaymentCancelledPage;
