'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCategory } from '@/lib/client/api';

const categoryFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  display_order: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function ServiceCategoryForm() {
  const createCategoryMutation = useCreateCategory();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors, isDirty },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      image_url: '',
      display_order: '0',
    },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      await createCategoryMutation.mutateAsync({
        name: data.name,
        description: data.description,
        image_url: data.image_url || undefined,
        display_order: data.display_order ? parseInt(data.display_order) : 0,
      });

      // Clear form after success
      reset();
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          New Service Category
        </h1>
        <p className="text-muted-foreground mt-2">
          Create a new service category. Categories help organize services like
          House Cleaning, AC Repair, Plumbing, etc.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Name */}
          <div>
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              placeholder="e.g., House Cleaning, AC Repair, Plumbing"
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
              placeholder="Describe this service category..."
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
              Optional - describe what services are included
            </p>
          </div>

          {/* Image URL */}
          <div>
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              placeholder="https://example.com/image.jpg"
              {...register('image_url')}
              className="mt-2"
            />
            {formErrors.image_url && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.image_url.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Optional - URL to category image
            </p>
          </div>

          {/* Display Order */}
          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              placeholder="0"
              {...register('display_order')}
              className="mt-2"
            />
            {formErrors.display_order && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.display_order.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Optional - controls the order categories appear (lower numbers
              first)
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
    </div>
  );
}
