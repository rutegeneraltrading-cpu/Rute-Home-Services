import type { Metadata } from 'next';
import { PrivacyPolicyPage } from '@/components/pages';
import { PRIVACY_POLICY_METADATA } from '@/lib/seo';

export const metadata: Metadata = PRIVACY_POLICY_METADATA;

const PrivacyPolicy = () => {
  return <PrivacyPolicyPage />;
};

export default PrivacyPolicy;
