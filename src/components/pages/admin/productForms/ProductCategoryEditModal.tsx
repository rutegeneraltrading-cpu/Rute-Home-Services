'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductCategoryEditModalProps } from '@/lib/types';
import { categoryEditSchema, CategoryEditValues } from '@/lib/validations';
import { useUpdateProductCategory } from '@/lib/client/api';

export function ProductCategoryEditModal({
  open,
  category,
  onOpenChange,
  onSuccess,
}: ProductCategoryEditModalProps) {
  const updateCategoryMutation = useUpdateProductCategory(category?.id || '');

  const defaultValues = useMemo(
    () => ({
      name: category?.name || '',
      description: category?.description || '',
    }),
    [category],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors, isDirty },
  } = useForm<CategoryEditValues>({
    resolver: zodResolver(categoryEditSchema),
    defaultValues,
  });

  useEffect(() => {
    if (category) {
      reset(defaultValues);
    }
  }, [category, reset, defaultValues]);

  const onSubmit = async (data: CategoryEditValues) => {
    if (!category) return;

    updateCategoryMutation.mutate(
      {
        name: data.name,
        description: data.description || undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
      },
    );
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the selected product category details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="category-name">Category Name *</Label>
            <Input id="category-name" {...register('name')} className="mt-2" />
            {formErrors.name && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="category-description">Description</Label>
            <textarea
              id="category-description"
              {...register('description')}
              className="mt-2 w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
            {formErrors.description && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.description.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateCategoryMutation.isPending || !isDirty}
            >
              {updateCategoryMutation.isPending
                ? 'Updating...'
                : 'Update Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
