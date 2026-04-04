import type { Metadata } from 'next';
import { BookingDetailsPage } from '@/components/pages/user';
import { USER_BOOKING_DETAIL_METADATA } from '@/lib/seo';

export const metadata: Metadata = USER_BOOKING_DETAIL_METADATA;

const BookingDetails = () => {
  return <BookingDetailsPage />;
};

export default BookingDetails;
