import type { Metadata } from 'next';
import { ServicesPage } from '@/components/pages';
import { ADMIN_SERVICES_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_SERVICES_METADATA;

const Services = () => {
  return <ServicesPage />;
};

export default Services;
