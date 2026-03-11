'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface AuthCodeHandlerProps {
  successRedirectPath?: string;
  errorRedirectPath?: string;
}

const AuthCodeHandler = ({
  successRedirectPath = '/user?verified=1',
  errorRedirectPath = '/login?error=auth_callback_failed',
}: AuthCodeHandlerProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;

    let isMounted = true;

    const exchangeCode = async () => {
      try {
        if (!isMounted) return;

        const callbackUrl = `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(successRedirectPath)}`;
        window.location.assign(callbackUrl);
      } catch (error) {
        console.error('Auth code exchange failed:', error);
        if (!isMounted) return;

        router.replace(errorRedirectPath);
      }
    };

    exchangeCode();

    return () => {
      isMounted = false;
    };
  }, [errorRedirectPath, router, searchParams, successRedirectPath]);

  return null;
};

export default AuthCodeHandler;
