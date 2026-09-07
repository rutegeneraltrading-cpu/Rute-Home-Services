'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, User, AlertCircle } from 'lucide-react';
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
        Create your account
      </h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        Book trusted home service pros and shop quality products.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Full name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
              className="h-10 pl-9"
              disabled={signUpMutation.isPending}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

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
              disabled={signUpMutation.isPending}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
            Phone
          </Label>
          <PhoneInput
            country={'za'}
            inputProps={{ name: 'phone' }}
            inputClass="!h-10 !w-full !rounded-md !border-slate-300 !text-sm !pl-12"
            buttonClass="!border-slate-300 !bg-slate-50"
            value={phone}
            onChange={(value) => {
              setPhone(value);
              if (errors.phone) {
                setErrors((prev) => ({ ...prev, phone: undefined }));
              }
            }}
            enableSearch
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
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
              className="h-10"
              minLength={8}
              disabled={signUpMutation.isPending}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }
              }}
              placeholder="••••••••"
              className="h-10"
              minLength={8}
              disabled={signUpMutation.isPending}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-xs leading-relaxed text-slate-600">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-green-600"
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
            Yes, sign me up to receive WhatsApp messages from Rute Home Services
            about my booking confirmations, worker assignments, and payment
            notifications. Message frequency varies. Message and data rates may
            apply. Reply STOP to opt out or HELP for help. See our{' '}
            <Link href="/terms-and-conditions" className="font-medium underline">
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="font-medium underline">
              Privacy Policy
            </Link>
            .
            {errors.whatsappConsent && (
              <span className="mt-1 block text-red-600">
                {errors.whatsappConsent}
              </span>
            )}
          </span>
        </label>

        <Button
          type="submit"
          className="h-10 w-full"
          disabled={signUpMutation.isPending}
        >
          {signUpMutation.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      {showChrome && (
        <>
          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-slate-900 hover:underline"
            >
              Sign in
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
};

export default SignupPage;
