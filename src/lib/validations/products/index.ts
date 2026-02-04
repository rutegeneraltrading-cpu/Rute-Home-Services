import z from 'zod';

export const categoryEditSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

export type CategoryEditValues = z.infer<typeof categoryEditSchema>;

export const productCategoryFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

export type ProductCategoryFormValues = z.infer<
  typeof productCategoryFormSchema
>;

export const productEditSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  category_id: z.string().min(1, 'Category is required'),
  stock: z.string().min(1, 'Stock is required'),
});

export type ProductEditValues = z.infer<typeof productEditSchema>;

export const productFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  category_id: z.string().min(1, 'Category is required'),
  stock: z.string().min(1, 'Stock is required'),
  image_url: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
