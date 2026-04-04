import type { Metadata } from 'next';
import { ReportsPage } from '@/components/pages';
import { ADMIN_REPORTS_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_REPORTS_METADATA;

const Reports = () => {
  return <ReportsPage />;
};

export default Reports;
