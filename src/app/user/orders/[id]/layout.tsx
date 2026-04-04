import type { Metadata } from 'next';
import { USER_ORDER_DETAIL_METADATA } from '@/lib/seo';

export const metadata: Metadata = USER_ORDER_DETAIL_METADATA;

export default function UserOrderDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
