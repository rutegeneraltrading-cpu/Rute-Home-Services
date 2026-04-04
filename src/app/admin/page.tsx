import type { Metadata } from 'next';

import { DashboardPage } from '@/components/pages';
import { ADMIN_DASHBOARD_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_DASHBOARD_METADATA;

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  return <DashboardPage />;
}
