import type { Metadata } from 'next';
import { OrdersPage } from '@/components/pages';
import { ADMIN_ORDERS_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_ORDERS_METADATA;

export default function Orders() {
  return <OrdersPage />;
}
