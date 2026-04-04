import type { Metadata } from 'next';
import { TermsAndConditionPage } from '@/components/pages';
import { TERMS_METADATA } from '@/lib/seo';

export const metadata: Metadata = TERMS_METADATA;

const TermsAndCondition = () => {
  return <TermsAndConditionPage />;
};

export default TermsAndCondition;
