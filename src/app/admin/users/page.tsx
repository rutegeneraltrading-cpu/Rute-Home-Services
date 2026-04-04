import type { Metadata } from 'next';
import { UsersPage } from '@/components/pages';
import { ADMIN_USERS_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_USERS_METADATA;

const Users = () => {
  return <UsersPage />;
};

export default Users;
