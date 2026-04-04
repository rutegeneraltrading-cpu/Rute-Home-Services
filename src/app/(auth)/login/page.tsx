import type { Metadata } from 'next';
import { LoginPage } from '@/components/pages';
import { LOGIN_METADATA } from '@/lib/seo';

export const metadata: Metadata = LOGIN_METADATA;

const Login = () => {
  return <LoginPage />;
};

export default Login;
