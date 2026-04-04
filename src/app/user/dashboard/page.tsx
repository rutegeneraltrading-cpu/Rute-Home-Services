import type { Metadata } from 'next';
import { DashboardPage } from '@/components/pages/user';
import { USER_DASHBOARD_METADATA } from '@/lib/seo';

export const metadata: Metadata = USER_DASHBOARD_METADATA;

const Dashboard = () => {
  return <DashboardPage />;
};
export default Dashboard;
