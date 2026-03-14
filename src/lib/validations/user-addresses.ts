import { z } from 'zod';

const e164PhoneRegex = /^\+[1-9]\d{7,14}$/;

const normalizePhoneToE164 = (value: string) => {
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly ? `+${digitsOnly}` : '';
};

export const optionalAddressPhoneSchema = z
  .string()
  .optional()
  .transform((value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return undefined;
    const normalized = normalizePhoneToE164(raw);
    return normalized || undefined;
  })
  .refine((value) => !value || e164PhoneRegex.test(value), {
    message:
      'Enter a valid phone number with country code (e.g., +27821234567)',
  });

export const requiredAddressPhoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .transform((value) => normalizePhoneToE164(value))
  .refine((value) => e164PhoneRegex.test(value), {
    message:
      'Enter a valid phone number with country code (e.g., +27821234567)',
  });

export const addressLine1Schema = z
  .string()
  .trim()
  .min(2, 'Address line 1 is required');

export const citySchema = z.string().trim().min(2, 'City is required');

export const stateProvinceSchema = z
  .string()
  .trim()
  .min(2, 'Province/State is required');

export const postalCodeSchema = z
  .string()
  .trim()
  .min(3, 'Postal code is required')
  .regex(/^\d+$/, 'Postal code must be numeric');

export const countrySchema = z.string().trim().min(2, 'Country is required');

const sharedAddressCoreSchema = z.object({
  recipient_name: z.string().trim().optional(),
  phone: requiredAddressPhoneSchema,
  line1: addressLine1Schema,
  line2: z.string().trim().optional(),
  city: citySchema,
  state_province: stateProvinceSchema,
  postal_code: postalCodeSchema,
  country: countrySchema,
});

export const userAddressSchema = sharedAddressCoreSchema.extend({
  label: z.enum(['home', 'office', 'other']),
  is_primary: z.boolean().default(false),
});

export const checkoutAddressSchema = sharedAddressCoreSchema.extend({
  recipient_name: z.string().trim().optional(),
  phone: requiredAddressPhoneSchema,
});

export type UserAddressFormValues = z.input<typeof userAddressSchema>;
export type CheckoutAddressInput = z.input<typeof checkoutAddressSchema>;
