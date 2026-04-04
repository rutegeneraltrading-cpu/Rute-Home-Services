import type { Metadata } from 'next';
import { ADMIN_BOOKING_DETAIL_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_BOOKING_DETAIL_METADATA;

export default function AdminBookingDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
