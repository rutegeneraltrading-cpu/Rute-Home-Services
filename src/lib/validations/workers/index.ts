import z from 'zod';
import {
  requiredAddressPhoneSchema,
  userAddressSchema,
} from '../user-addresses';

const workerAddressSchema = userAddressSchema.extend({
  is_primary: z.boolean().default(true),
});

export const workerEditSchema = z.object({
  full_name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  phone: requiredAddressPhoneSchema,
  service_ids: z.array(z.string()).min(1, 'Select at least one service'),
  status: z.enum(['active', 'inactive', 'suspended']),
  address: workerAddressSchema,
  // Add more fields here for future extensibility
});

export type WorkerEditValues = z.input<typeof workerEditSchema>;

export const workerFormSchema = z.object({
  full_name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: requiredAddressPhoneSchema,
  service_ids: z.array(z.string()).min(1, 'Select at least one service'),
  address: workerAddressSchema,
  documents: z
    .array(
      z.object({
        type: z.string(), // Should match DocumentType enum
        file_url: z.string().url('Invalid document URL'),
      }),
    )
    .optional(), // Only required for registration, not edit
  // Add more fields here for future extensibility
});

export type WorkerFormValues = z.input<typeof workerFormSchema>;
