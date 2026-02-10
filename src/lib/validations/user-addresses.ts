import { z } from 'zod';

export const userAddressSchema = z.object({
  label: z.enum(['home', 'office', 'other']),
  recipient_name: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || /^\d+$/.test(value), {
      message: 'Phone must be numeric',
    }),
  line1: z.string().min(2, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state_province: z.string().min(2, 'Province/State is required'),
  postal_code: z
    .string()
    .min(3, 'Postal code is required')
    .refine((value) => /^\d+$/.test(value), {
      message: 'Postal code must be numeric',
    }),
  country: z.string().min(2, 'Country is required'),
  is_primary: z.boolean().default(false),
});

export type UserAddressFormValues = z.infer<typeof userAddressSchema>;
