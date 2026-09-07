'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, AlertCircle } from 'lucide-react';
import { useSignIn } from '@/lib/client/api';
import {
  getFirstZodFieldErrors,
  LoginInput,
  loginSchema,
} from '@/lib/validations';
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
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginInput, string>>
  >({});
  const verificationRequired = searchParams.get('verify') === '1';
  const redirectParam = searchParams.get('redirect');

  const safeRedirectFromQuery =
    redirectParam && redirectParam.startsWith('/') ? redirectParam : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = loginSchema.safeParse({ email, password });

    if (!validation.success) {
      setErrors(getFirstZodFieldErrors(validation.error));
      return;
    }

    setErrors({});

    try {
      const response = await signInMutation.mutateAsync(validation.data);
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (onSuccess) {
        onSuccess();
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else if (safeRedirectFromQuery) {
        router.push(safeRedirectFromQuery);
      } else if (response?.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    } catch (err: unknown) {
      console.error('Login failed:', err);
    }
  };

  const showChrome = !hideFooterLinks;

  return (
    <div
      className={`mt-16 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 lg:mt-0 ${
        className || ''
      }`}
    >
      {showChrome && (
        <Link
          href="/"
          className="mb-6 block text-center text-xl font-bold tracking-tight text-slate-900"
        >
          RUTE<span className="text-green-600">.</span>
        </Link>
      )}

      <h1 className="text-center text-2xl font-semibold text-slate-900">
        Welcome back
      </h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        Sign in to book services, track jobs and shop products.
      </p>

      {verificationRequired && (
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Please verify your email first. Check your inbox (and spam folder),
            then sign in.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="you@example.com"
              className="h-10 pl-9"
              disabled={signInMutation.isPending}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            placeholder="••••••••"
            className="h-10"
            disabled={signInMutation.isPending}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          className="h-10 w-full"
          disabled={signInMutation.isPending}
        >
          {signInMutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {showChrome && (
        <>
          <p className="mt-5 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-slate-900 hover:underline"
            >
              Sign up
            </Link>
          </p>
          <div className="mt-4 border-t border-slate-100 pt-4 text-center">
            <Link
              href="/register/worker"
              className="text-sm font-medium text-green-700 hover:underline"
            >
              Want to offer services? Become a provider →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
