import type { Metadata } from 'next';
import { ForgotPasswordPage } from '@/components/pages';
import { FORGOT_PASSWORD_METADATA } from '@/lib/seo';

export const metadata: Metadata = FORGOT_PASSWORD_METADATA;

const ForgotPassword = () => {
  return <ForgotPasswordPage />;
};

export default ForgotPassword;
