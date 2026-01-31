import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be greater than 0'),
  image_url: z.string().url('Invalid image URL'),
  category: z.string().min(2, 'Category is required'),
  stock: z.number().int().min(0, 'Stock must be 0 or more'),
  is_active: z.boolean().default(true),
});

export const serviceSchema = z.object({
  name: z.string().min(2, 'Service name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be greater than 0'),
  image_url: z.string().url('Invalid image URL'),
  category: z.string().min(2, 'Category is required'),
  duration_minutes: z
    .number()
    .int()
    .positive('Duration must be greater than 0'),
  is_active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
