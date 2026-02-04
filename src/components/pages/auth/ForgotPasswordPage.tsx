'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { useForgotPassword } from '@/lib/client/api';

const ForgotPasswordPage = () => {
  const router = useRouter();
  const forgotPasswordMutation = useForgotPassword({
    onSuccess: () => {
      setTimeout(() => router.push('/login'), 2000);
    },
  });

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync(email);
      setSubmitted(true);
      setEmail('');
    } catch (err) {
      console.error('Forgot password failed:', err);
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg mt-16 lg:mt-0">
      <h1 className="text-2xl font-bold text-center mb-2">Reset Password</h1>
      <p className="text-center text-slate-600 mb-6">
        Enter your email address and we&apos;ll send you a password reset link.
      </p>

      {submitted ? (
        <div className="space-y-4">
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Check your email for the password reset link. Redirecting to
            login...
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={forgotPasswordMutation.isPending}
            />
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={forgotPasswordMutation.isPending}
          >
            {forgotPasswordMutation.isPending
              ? 'Sending...'
              : 'Send Reset Link'}
          </Button>
        </form>
      )}

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
