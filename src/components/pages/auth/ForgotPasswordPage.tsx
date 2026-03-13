'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { useForgotPassword } from '@/lib/client/api';
import {
  ForgotPasswordInput,
  forgotPasswordSchema,
  getFirstZodFieldErrors,
} from '@/lib/validations';

const ForgotPasswordPage = () => {
  const forgotPasswordMutation = useForgotPassword();

  const [email, setEmail] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ForgotPasswordInput, string>>
  >({});

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldownSeconds > 0) {
      return;
    }

    const validation = forgotPasswordSchema.safeParse({ email });

    if (!validation.success) {
      setErrors(getFirstZodFieldErrors(validation.error));
      return;
    }

    setErrors({});

    try {
      await forgotPasswordMutation.mutateAsync(validation.data);
      setCooldownSeconds(60);
    } catch (err) {
      console.error('Forgot password failed:', err);
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white md:p-8 p-6 shadow-lg mt-16 lg:mt-0">
      <h1 className="text-2xl font-bold text-center mb-2">Reset Password</h1>
      <p className="text-center text-slate-600 mb-6">
        Enter your email address and we&apos;ll send you a password reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email Address
          </label>
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
            disabled={forgotPasswordMutation.isPending || cooldownSeconds > 0}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
          {cooldownSeconds > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              You can send another forgot password request after 1 minute.
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={forgotPasswordMutation.isPending || cooldownSeconds > 0}
        >
          {forgotPasswordMutation.isPending
            ? 'Sending...'
            : cooldownSeconds > 0
              ? `Try again in ${cooldownSeconds}s`
              : 'Send Reset Link'}
        </Button>
      </form>

      <p className="text-center text-slate-600 text-sm mt-4">
        Remember your password?{' '}
        <Link
          href="/login"
          className="text-slate-900 font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
