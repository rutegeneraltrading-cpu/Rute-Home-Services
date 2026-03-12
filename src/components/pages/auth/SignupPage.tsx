'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@/lib/client/api';
import PhoneInput from 'react-phone-input-2';
import { Button, Input, Label, PasswordInput } from '@/components/ui';

interface SignupPageProps {
  redirectTo?: string;
  onSuccess?: () => void;
  hideFooterLinks?: boolean;
  className?: string;
}

const SignupPage = ({
  redirectTo,
  onSuccess,
  hideFooterLinks = false,
  className,
}: SignupPageProps) => {
  const router = useRouter();
  const signUpMutation = useSignUp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await signUpMutation.mutateAsync({
        email,
        password,
        name,
        phone,
      });

      if (response?.requires_email_verification) {
        router.push(`/login?verify=1&email=${encodeURIComponent(email)}`);
        return;
      }

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
      console.error('Sign up failed:', err);
    }
  };

  return (
    <div
      className={`w-full max-w-md rounded-lg border border-slate-200 bg-white md:p-8 p-6 shadow-lg mt-16 lg:mt-0 ${
        className || ''
      }`}
    >
      <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
      <p className="text-center text-slate-600 mb-6">Sign up to get started</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            disabled={signUpMutation.isPending}
          />
        </div>

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
            disabled={signUpMutation.isPending}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <PhoneInput
            country={'za'}
            inputProps={{
              name: 'phone',
              required: true,
              className: 'h-9 w-full border rounded-md shadow-xs px-2 pl-12',
            }}
            value={phone}
            onChange={(value) => setPhone(value)}
            enableSearch
            containerClass="mb-2"
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
            minLength={6}
            disabled={signUpMutation.isPending}
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
            disabled={signUpMutation.isPending}
          />
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={signUpMutation.isPending}
        >
          {signUpMutation.isPending ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>

      {!hideFooterLinks && (
        <p className="text-center text-slate-600 text-sm mt-4">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-slate-900 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
};

export default SignupPage;
