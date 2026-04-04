import type { Metadata } from 'next';
import { ContactsPage } from '@/components/pages';
import { ADMIN_CONTACTS_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_CONTACTS_METADATA;

const Contacts = () => {
  return <ContactsPage />;
};

export default Contacts;
