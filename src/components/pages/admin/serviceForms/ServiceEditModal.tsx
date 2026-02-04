'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetCategories, useUpdateService } from '@/lib/client/api';
import { ServiceEditModalProps } from '@/lib/types';
import { serviceEditSchema, ServiceEditValues } from '@/lib/validations';

export function ServiceEditModal({
  open,
  service,
  onOpenChange,
  onSuccess,
}: ServiceEditModalProps) {
  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const updateServiceMutation = useUpdateService(service?.id || '');

  // Derive selectedCategoryId from service prop instead of using state
  const selectedCategoryId = service?.category_id || '';

  const defaultValues = useMemo(
    () => ({
      category_id: service?.category_id || '',
      name: service?.name || '',
      description: service?.description || '',
      base_price: service?.base_price ? String(service.base_price) : '',
      duration_minutes: service?.duration_minutes
        ? String(service.duration_minutes)
        : '',
      is_active: service?.is_active ?? true,
    }),
    [service],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ServiceEditValues>({
    resolver: zodResolver(serviceEditSchema),
    defaultValues,
  });

  useEffect(() => {
    if (service) {
      reset(defaultValues);
    }
  }, [service, reset, defaultValues]);

  const onSubmit = async (data: ServiceEditValues) => {
    if (!service) return;

    updateServiceMutation.mutate(
      {
        category_id: data.category_id,
        name: data.name,
        description: data.description || undefined,
        base_price: parseFloat(data.base_price),
        duration_minutes: parseInt(data.duration_minutes, 10),
        is_active: data.is_active,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
      },
    );
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
          <DialogDescription>
            Update the selected service details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="category_id">Service Category *</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(value) => {
                setValue('category_id', value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              disabled={categoriesLoading || updateServiceMutation.isPending}
            >
              <SelectTrigger id="category_id" className="mt-2">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading ? (
                  <SelectItem disabled value="loading">
                    Loading categories...
                  </SelectItem>
                ) : categories?.categories &&
                  categories.categories.length > 0 ? (
                  categories.categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="none">
                    No categories available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-sm text-red-500 mt-1">
                {errors.category_id.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="name">Service Name *</Label>
            <Input id="name" {...register('name')} className="mt-2" />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              className="mt-2 w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="base_price">Base Price (R) *</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                {...register('base_price')}
                className="mt-2"
              />
              {errors.base_price && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.base_price.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="duration_minutes">Duration (Minutes) *</Label>
              <Input
                id="duration_minutes"
                type="number"
                {...register('duration_minutes')}
                className="mt-2"
              />
              {errors.duration_minutes && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.duration_minutes.message}
                </p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 rounded border-gray-300"
            />
            Active
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateServiceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateServiceMutation.isPending || !isDirty}
            >
              {updateServiceMutation.isPending
                ? 'Updating...'
                : 'Update Service'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
