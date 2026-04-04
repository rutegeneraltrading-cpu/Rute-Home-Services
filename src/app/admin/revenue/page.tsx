import type { Metadata } from 'next';
import { RevenuePage } from '@/components/pages';
import { ADMIN_REVENUE_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_REVENUE_METADATA;

const Revenue = () => {
  return <RevenuePage />;
};

export default Revenue;
