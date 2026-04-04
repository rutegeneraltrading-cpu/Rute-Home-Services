import type { Metadata } from 'next';
import { RegisterWorkerPage } from '@/components/pages';
import { REGISTER_WORKER_METADATA } from '@/lib/seo';

export const metadata: Metadata = REGISTER_WORKER_METADATA;

const RegisterWorker = () => {
  return <RegisterWorkerPage />;
};

export default RegisterWorker;
