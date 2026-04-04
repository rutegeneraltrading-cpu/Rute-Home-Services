import type { Metadata } from 'next';
import { OrdersPage } from '@/components/pages/user';
import { USER_ORDERS_METADATA } from '@/lib/seo';

export const metadata: Metadata = USER_ORDERS_METADATA;

const Orders = () => {
  return <OrdersPage />;
};

export default Orders;
