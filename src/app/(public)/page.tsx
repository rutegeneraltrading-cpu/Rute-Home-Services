import type { Metadata } from 'next';
import { HomePage } from '@/components/pages';
import { HOME_METADATA } from '@/lib/seo';

export const metadata: Metadata = HOME_METADATA;

const Home = () => {
  return <HomePage />;
};

export default Home;
