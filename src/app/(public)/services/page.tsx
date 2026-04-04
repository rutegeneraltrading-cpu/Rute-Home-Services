import type { Metadata } from 'next';
import { ServicesPPage } from '@/components/pages';
import { SERVICES_METADATA } from '@/lib/seo';

export const metadata: Metadata = SERVICES_METADATA;

const Services = () => {
  return <ServicesPPage />;
};

export default Services;
