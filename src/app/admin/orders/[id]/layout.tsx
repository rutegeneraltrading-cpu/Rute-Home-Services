import type { Metadata } from 'next';
import { ADMIN_ORDER_DETAIL_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_ORDER_DETAIL_METADATA;

export default function AdminOrderDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
