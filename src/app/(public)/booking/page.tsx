import type { Metadata } from 'next';
import { BookingPage } from '@/components/pages';
import { BOOKING_METADATA } from '@/lib/seo';

export const metadata: Metadata = BOOKING_METADATA;

const Booking = () => {
  return <BookingPage />;
};

export default Booking;
