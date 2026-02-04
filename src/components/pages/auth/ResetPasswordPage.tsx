'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/common';
import { useResetPassword } from '@/lib/client/api';
import { createClient } from '@/lib/supabase/client';
import { Button, PasswordInput } from '@/components/ui';

const ResetPasswordPage = () => {
  const router = useRouter();
  const resetPasswordMutation = useResetPassword({
    onSuccess: () => {
      setTimeout(() => router.push('/login'), 2000);
    },
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setIsValidToken(true);
        } else {
          setError('Invalid or expired reset link. Please request a new one.');
        }
      } catch {
        setError('Invalid or expired reset link. Please request a new one.');
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync(password);
    } catch (err) {
      console.error('Reset password failed:', err);
    }
  };

  if (isLoading) return <Loading fullScreen />;

  if (!isValidToken) {
    return (
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg mt-16 lg:mt-0">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            href="/forgot-password"
            className="text-slate-900 font-medium hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg mt-16 lg:mt-0">
      <h1 className="text-2xl font-bold text-center mb-2">
        Create New Password
      </h1>
      <p className="text-center text-slate-600 mb-6">
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            New Password
          </label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            disabled={resetPasswordMutation.isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Confirm Password
          </label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            disabled={resetPasswordMutation.isPending}
          />
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending
            ? 'Updating Password...'
            : 'Reset Password'}
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

export default ResetPasswordPage;
