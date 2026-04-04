import type { Metadata } from 'next';
import { ProfilePage } from '@/components/pages';
import { ADMIN_PROFILE_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_PROFILE_METADATA;

const Profile = () => {
  return <ProfilePage />;
};

export default Profile;
