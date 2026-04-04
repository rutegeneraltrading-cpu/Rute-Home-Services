import type { Metadata } from 'next';
import { ContactUsPage } from '@/components/pages';
import { CONTACT_METADATA } from '@/lib/seo';

export const metadata: Metadata = CONTACT_METADATA;

const ContactUs = () => {
  return <ContactUsPage />;
};

export default ContactUs;
