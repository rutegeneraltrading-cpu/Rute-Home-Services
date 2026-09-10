import type { Metadata } from 'next';
import { ADMIN_WORKER_DETAIL_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_WORKER_DETAIL_METADATA;

export default function AdminWorkerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
