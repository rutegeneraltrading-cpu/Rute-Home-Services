import type { Metadata } from 'next';
import { PaymentHistoryPage } from '@/components/pages/user';
import { USER_PAYMENT_HISTORY_METADATA } from '@/lib/seo';

export const metadata: Metadata = USER_PAYMENT_HISTORY_METADATA;

const PaymentHistory = () => {
  return <PaymentHistoryPage />;
};

export default PaymentHistory;
