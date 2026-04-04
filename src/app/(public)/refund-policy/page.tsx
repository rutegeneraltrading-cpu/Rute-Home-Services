import type { Metadata } from 'next';
import { RefundPolicyPage } from '@/components/pages';
import { REFUND_POLICY_METADATA } from '@/lib/seo';

export const metadata: Metadata = REFUND_POLICY_METADATA;

const RefundPolicy = () => {
  return <RefundPolicyPage />;
};

export default RefundPolicy;
