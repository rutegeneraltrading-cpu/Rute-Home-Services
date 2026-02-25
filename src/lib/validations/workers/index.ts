import z from 'zod';
import { userAddressSchema } from '../user-addresses';

const workerAddressSchema = userAddressSchema.extend({
  is_primary: z.boolean().default(true),
});

export const workerEditSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  service_id: z.string().min(1, 'Service is required'),
  status: z.enum(['active', 'inactive', 'suspended']),
  address: workerAddressSchema,
});

export type WorkerEditValues = z.input<typeof workerEditSchema>;

export const workerFormSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  service_id: z.string().min(1, 'Please select a service'),
  address: workerAddressSchema,
});

export type WorkerFormValues = z.input<typeof workerFormSchema>;
