import z from 'zod';

export const categoryEditServiceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  charge_type: z.enum(['hourly', 'day']),
  display_order: z.number().int().min(0, 'Display order must be 0 or greater'),
});

export type CategoryEditServiceValues = z.infer<
  typeof categoryEditServiceSchema
>;

export const categoryFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  charge_type: z.enum(['hourly', 'day']),
  display_order: z.number().int().min(0, 'Display order must be 0 or greater'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const serviceEditSchema = z.object({
  category_id: z.string().min(1, 'Please select a service category'),
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().optional(),
  base_price: z.string().min(1, 'Price is required'),
  duration_minutes: z.string().min(1, 'Duration is required'),
  is_active: z.boolean(),
  platform_fee: z.number().min(0, 'Platform fee must be 0 or greater'),
  priority_fee: z.number().min(0, 'Priority fee must be 0 or greater'),
  app_fee: z.number().min(0, 'App fee must be 0 or greater'),
});

export type ServiceEditValues = z.infer<typeof serviceEditSchema>;

export const serviceSchema = z.object({
  category_id: z.string().min(1, 'Please select a service category'),
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string(),
  base_price: z.string().refine((val) => !Number.isNaN(parseFloat(val)), {
    message: 'Price must be a valid number',
  }),
  duration_minutes: z.string().refine((val) => parseInt(val) > 0, {
    message: 'Duration must be greater than 0',
  }),
  platform_fee: z.number().min(0, 'Platform fee must be 0 or greater'),
  priority_fee: z.number().min(0, 'Priority fee must be 0 or greater'),
  app_fee: z.number().min(0, 'App fee must be 0 or greater'),
});

export const optionEditSchema = z.object({
  category_id: z.string().min(1, 'Please select a service category'),
  service_id: z.string().min(1, 'Please select a service'),
  name: z.string().min(2, 'Option name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  duration_minutes: z.string().optional(),
  is_required: z.boolean(),
  is_active: z.boolean(),
  display_order: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  platform_fee: z.number().min(0, 'Platform fee must be 0 or greater'),
});

export type OptionEditValues = z.infer<typeof optionEditSchema>;

export const serviceOptionSchema = z.object({
  name: z.string().min(2, 'Option name must be at least 2 characters'),
  description: z.string().default(''),
  price: z.string().refine((val) => !Number.isNaN(parseFloat(val)), {
    message: 'Price must be a valid number',
  }),
  duration_minutes: z
    .string()
    .default('0')
    .refine((val) => parseInt(val) >= 0, {
      message: 'Duration must be 0 or greater',
    }),
  is_required: z.boolean().default(false),
  display_order: z.string().default('0'),
  type: z.string().min(1, 'Type is required'),
  platform_fee: z.number().min(0, 'Platform fee must be 0 or greater'),
});

export type ServiceOptionFormValues = z.infer<typeof serviceOptionSchema>;

export const userEditSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  status: z.enum(['active', 'inactive', 'suspended']),
});

export type UserEditValues = z.infer<typeof userEditSchema>;
