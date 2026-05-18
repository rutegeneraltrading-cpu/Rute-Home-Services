import type { Metadata } from 'next';
import { AboutPage } from '@/components/pages';
import { ABOUT_METADATA } from '@/lib/seo';

export const metadata: Metadata = ABOUT_METADATA;

const About = () => {
  return <AboutPage />;
};

export default About;
