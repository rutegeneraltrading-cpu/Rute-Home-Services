'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignIn } from '@/lib/client/api';
import { Button, Input, PasswordInput } from '@/components/ui';

interface LoginPageProps {
  redirectTo?: string;
  onSuccess?: () => void;
  hideFooterLinks?: boolean;
  className?: string;
}

export default function LoginPage({
  redirectTo,
  onSuccess,
  hideFooterLinks = false,
  className,
}: LoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signInMutation = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const verificationRequired = searchParams.get('verify') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await signInMutation.mutateAsync({ email, password });
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (onSuccess) {
        onSuccess();
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else if (response?.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    } catch (err: unknown) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div
      className={`w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg mt-16 lg:mt-0 ${
        className || ''
      }`}
    >
      <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
      <p className="text-center text-slate-600 mb-6">
        Sign in to access your account
      </p>

      {verificationRequired && (
        <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Please verify your email first. Check your inbox (and spam folder),
          then sign in.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={signInMutation.isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={signInMutation.isPending}
          />
        </div>
        <p className="text-start text-sm mt-2">
          <Link
            href="/forgot-password"
            className="text-slate-600 font-medium hover:text-black"
          >
            Forgot your password?
          </Link>
        </p>
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={signInMutation.isPending}
        >
          {signInMutation.isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {!hideFooterLinks && (
        <p className="text-center text-slate-600 text-sm mt-4">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-slate-900 font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      )}
    </div>
  );
}
