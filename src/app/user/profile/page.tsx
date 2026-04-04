import type { Metadata } from 'next';
import { ProfilePage } from '@/components/pages/user';
import { USER_PROFILE_METADATA } from '@/lib/seo';

export const metadata: Metadata = USER_PROFILE_METADATA;

const Profile = () => {
  return <ProfilePage />;
};

export default Profile;
