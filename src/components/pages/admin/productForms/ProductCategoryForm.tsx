'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const productCategoryFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

type ProductCategoryFormValues = z.infer<typeof productCategoryFormSchema>;

interface ProductCategoryFormProps {
  onSuccess?: () => void;
}

export function ProductCategoryForm({ onSuccess }: ProductCategoryFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create category');
      }

      toast.success('Product category created successfully');
      await queryClient.invalidateQueries({
        queryKey: ['product-categories'],
      });
      reset();
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create category';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6">
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? 'Creating...' : 'Create Category'}
          </Button>
        </div>
      </form>
    </div>
  );
}
