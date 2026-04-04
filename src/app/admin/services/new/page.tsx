import type { Metadata } from 'next';
import { NewServicePage } from '@/components/pages';
import { ADMIN_NEW_SERVICE_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_NEW_SERVICE_METADATA;

const NewService = () => {
  return <NewServicePage />;
};

export default NewService;
