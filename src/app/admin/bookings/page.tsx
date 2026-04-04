import type { Metadata } from 'next';
import { BookingsPage } from '@/components/pages';
import { ADMIN_BOOKINGS_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_BOOKINGS_METADATA;

const Bookings = () => {
  return <BookingsPage />;
};

export default Bookings;
