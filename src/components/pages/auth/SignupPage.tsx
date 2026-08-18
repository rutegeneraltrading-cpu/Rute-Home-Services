'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@/lib/client/api';
import PhoneInput from 'react-phone-input-2';
import { Button, Input, Label, PasswordInput } from '@/components/ui';
import {
  getFirstZodFieldErrors,
  SignupInput,
  signupSchema,
} from '@/lib/validations';

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
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupInput, string>>
  >({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    const validation = signupSchema.safeParse({
      name,
      email,
      phone,
      password,
      confirmPassword,
      whatsappConsent,
    });

    if (!validation.success) {
      setErrors(getFirstZodFieldErrors(validation.error));
      return;
    }

    try {
      const signUpData = {
        name: validation.data.name,
        email: validation.data.email,
        phone: validation.data.phone,
        password: validation.data.password,
      };

      const response = await signUpMutation.mutateAsync({
        ...signUpData,
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
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            placeholder="John Doe"
            disabled={signUpMutation.isPending}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
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
            disabled={signUpMutation.isPending}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <PhoneInput
            country={'za'}
            inputProps={{
              name: 'phone',
              className: 'h-9 w-full border rounded-md shadow-xs px-2 pl-12',
            }}
            value={phone}
            onChange={(value) => {
              setPhone(value);
              if (errors.phone) {
                setErrors((prev) => ({ ...prev, phone: undefined }));
              }
            }}
            enableSearch
            containerClass="mb-2"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
        <div>
          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0"
              checked={whatsappConsent}
              onChange={(e) => {
                setWhatsappConsent(e.target.checked);
                if (errors.whatsappConsent) {
                  setErrors((prev) => ({
                    ...prev,
                    whatsappConsent: undefined,
                  }));
                }
              }}
              disabled={signUpMutation.isPending}
            />
            <span>
              Yes, sign me up to receive WhatsApp messages from Rute Home
              Services about my booking confirmations, worker assignments,
              and payment notifications. Message frequency varies. Message
              and data rates may apply. Reply STOP to opt out or HELP for
              help. See our{' '}
              <Link href="/terms-and-conditions" className="underline">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.whatsappConsent && (
            <p className="mt-1 text-sm text-red-600">
              {errors.whatsappConsent}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <PasswordInput
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            placeholder="••••••••"
            minLength={8}
            disabled={signUpMutation.isPending}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Confirm Password
          </label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
            placeholder="••••••••"
            minLength={8}
            disabled={signUpMutation.isPending}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword}
            </p>
          )}
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
