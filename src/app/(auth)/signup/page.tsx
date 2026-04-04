import type { Metadata } from 'next';
import { SignupPage } from '@/components/pages';
import { SIGNUP_METADATA } from '@/lib/seo';

export const metadata: Metadata = SIGNUP_METADATA;

const Signup = () => {
  return <SignupPage />;
};

export default Signup;
