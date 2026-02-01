'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@/lib/api/auth.mutation';
import { Button, Input, PasswordInput } from '@/components/ui';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const signUpMutation = useSignUp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
      });
      // Wait a bit for Supabase session to be established
      await new Promise((resolve) => setTimeout(resolve, 500));
      // After successful signup, redirect to user dashboard
      if (response?.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Sign up failed');
      } else {
        setError('Sign up failed');
      }
    }
  };

  return (
    <div className="lg:relative flex lg:flex-row flex-col min-h-screen items-center justify-center bg-slate-50 px-4">
      <Link
        href="/"
        className="lg:absolute top-8 left-8 text-2xl font-bold text-center lg:text-left w-full lg:w-auto"
      >
        RUTE<span className="text-green-600">.</span>
      </Link>
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg mt-16 lg:mt-0">
        <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-center text-slate-600 mb-6">
          Sign up to get started
        </p>

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

        <p className="text-center text-slate-600 text-sm mt-4">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-slate-900 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
