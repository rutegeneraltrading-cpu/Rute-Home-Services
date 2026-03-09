import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';

const BookingPaymentSuccessPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">
          Payment Successful
        </h1>
        <p className="mt-2 text-slate-600">
          Your booking payment is completed successfully.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button asChild>
            <Link href="/user/bookings">View My Bookings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/services">Book Another Service</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingPaymentSuccessPage;
