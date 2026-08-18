import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email address');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must not exceed 72 characters');

const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .refine((value) => value.trim().length > 0, 'Password is required');

const strongPasswordSchema = passwordSchema
  .regex(/[a-z]/, 'Password must include at least 1 lowercase letter')
  .regex(/[A-Z]/, 'Password must include at least 1 uppercase letter')
  .regex(/[0-9]/, 'Password must include at least 1 number')
  .regex(/[^A-Za-z0-9]/, 'Password must include at least 1 special character');

const nameSchema = z
  .string()
  .trim()
  .min(3, 'Name must be at least 3 characters')
  .max(80, 'Name must not exceed 80 characters');

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .transform((value) => {
    const digitsOnly = value.replace(/\D/g, '');
    return `+${digitsOnly}`;
  })
  .refine(
    (value) => /^\+[1-9]\d{7,14}$/.test(value),
    'Enter a valid phone number with country code (e.g., +27821234567)',
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    whatsappConsent: z.boolean().refine((value) => value === true, {
      message: 'Please agree to receive WhatsApp notifications to continue',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export function getFirstZodFieldErrors<T extends Record<string, unknown>>(
  error: z.ZodError<T>,
) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0] ?? 'Invalid value',
    ]),
  ) as Partial<Record<keyof T, string>>;
}

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
