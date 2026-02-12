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
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  sale_price: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().optional(),
  attributes: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Attributes must be valid JSON' },
    ),
  category_id: z.string().min(1, 'Category is required'),
  stock: z.string().min(1, 'Stock is required'),
});

export type ProductEditValues = z.infer<typeof productEditSchema>;

export const productFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  sale_price: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().optional(),
  attributes: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Attributes must be valid JSON' },
    ),
  category_id: z.string().min(1, 'Category is required'),
  stock: z.string().min(1, 'Stock is required'),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
