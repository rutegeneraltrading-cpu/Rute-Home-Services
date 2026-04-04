import type { Metadata } from 'next';
import { CANCELLED_METADATA } from '@/lib/seo';
import CancelledView from './_cancelled-view';

export const metadata: Metadata = CANCELLED_METADATA;

const CancelledPage = () => {
  return <CancelledView />;
};

export default CancelledPage;
