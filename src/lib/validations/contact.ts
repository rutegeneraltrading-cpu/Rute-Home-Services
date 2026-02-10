import { z } from 'zod';

export const contactSubjectEnum = z.enum([
  'general',
  'booking',
  'payments',
  'account',
  'other',
]);

export const contactMessageSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: contactSubjectEnum,
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
