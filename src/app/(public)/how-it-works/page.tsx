import type { Metadata } from 'next';
import { HowItWorksPage } from '@/components/pages';
import { HOW_IT_WORKS_METADATA } from '@/lib/seo';

export const metadata: Metadata = HOW_IT_WORKS_METADATA;

const HowItWorks = () => {
  return <HowItWorksPage />;
};

export default HowItWorks;
