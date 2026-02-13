'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  productCategoryFormSchema,
  ProductCategoryFormValues,
} from '@/lib/validations';
import { ProductCategoryFormProps } from '@/lib/types';
import { useCreateProductCategory } from '@/lib/client/api';

export function ProductCategoryForm({ onSuccess }: ProductCategoryFormProps) {
  const createCategoryMutation = useCreateProductCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors, isDirty },
  } = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(productCategoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: ProductCategoryFormValues) => {
    createCategoryMutation.mutate(
      {
        name: data.name,
        description: data.description || undefined,
      },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      },
    );
  };

  return (
    <div className="bg-card md:border md:rounded-lg md:p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Category Name */}
        <div>
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Cleaning Supplies, Equipment, Safety Gear"
            {...register('name')}
            className="mt-2"
          />
          {formErrors.name && (
            <p className="text-sm text-red-500 mt-1">
              {formErrors.name.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            placeholder="Describe this product category..."
            {...register('description')}
            className="mt-2 w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4}
          />
          {formErrors.description && (
            <p className="text-sm text-red-500 mt-1">
              {formErrors.description.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Optional - describe what products are included
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={createCategoryMutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={createCategoryMutation.isPending || !isDirty}
          >
            {createCategoryMutation.isPending
              ? 'Creating...'
              : 'Create Category'}
          </Button>
        </div>
      </form>
    </div>
  );
}
