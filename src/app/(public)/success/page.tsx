import type { Metadata } from 'next';
import { SUCCESS_METADATA } from '@/lib/seo';
import SuccessView from './_success-view';

export const metadata: Metadata = SUCCESS_METADATA;

const SuccessPage = () => {
  return <SuccessView />;
};

export default SuccessPage;
