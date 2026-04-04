import type { Metadata } from 'next';
import { ResetPasswordPage } from '@/components/pages';
import { RESET_PASSWORD_METADATA } from '@/lib/seo';

export const metadata: Metadata = RESET_PASSWORD_METADATA;

const ResetPassword = () => {
  return <ResetPasswordPage />;
};

export default ResetPassword;
