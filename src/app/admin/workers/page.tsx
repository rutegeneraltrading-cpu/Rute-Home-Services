import type { Metadata } from 'next';
import { WorkersPage } from '@/components/pages';
import { ADMIN_WORKERS_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_WORKERS_METADATA;

const Workers = () => {
  return <WorkersPage />;
};

export default Workers;
