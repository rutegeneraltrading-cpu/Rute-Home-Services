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
import { ServiceOptionEditModalProps } from '@/lib/types';
import {
  useGetCategories,
  useGetServices,
  useUpdateServiceOption,
} from '@/lib/client/api';
import { optionEditSchema, OptionEditValues } from '@/lib/validations';

export function ServiceOptionEditModal({
  open,
  option,
  onOpenChange,
  onSuccess,
}: ServiceOptionEditModalProps) {
  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategories();
  const { data: servicesData, isLoading: servicesLoading } = useGetServices();

  const categories = categoriesData?.categories || [];
  const allServices = useMemo(() => servicesData || [], [servicesData]);

  // Derive selected IDs from option and services
  const selectedService = useMemo(
    () => allServices.find((s) => s.id === option?.service_id),
    [allServices, option?.service_id],
  );
  const selectedCategoryId = selectedService?.category_id || '';
  const selectedServiceId = option?.service_id || '';

  const updateOptionMutation = useUpdateServiceOption(
    selectedServiceId,
    option?.id || '',
  );

  // Filter services based on selected category
  const filteredServices = useMemo(
    () =>
      selectedCategoryId
        ? allServices.filter((s) => s.category_id === selectedCategoryId)
        : [],
    [selectedCategoryId, allServices],
  );

  const defaultValues = useMemo(
    () => ({
      category_id: selectedCategoryId,
      service_id: option?.service_id || '',
      name: option?.name || '',
      description: option?.description || '',
      price: option?.price ? String(option.price) : '',
      duration_minutes:
        option?.duration_minutes !== null &&
        option?.duration_minutes !== undefined
          ? String(option.duration_minutes)
          : '0',
      is_required: option?.is_required ?? false,
      display_order:
        option?.display_order !== null && option?.display_order !== undefined
          ? String(option.display_order)
          : '0',
      is_active: option?.is_active ?? true,
    }),
    [option, selectedCategoryId],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<OptionEditValues>({
    resolver: zodResolver(optionEditSchema),
    defaultValues,
  });

  useEffect(() => {
    if (option) {
      reset(defaultValues);
    }
  }, [option, reset, defaultValues]);

  const onSubmit = async (data: OptionEditValues) => {
    if (!option) return;

    updateOptionMutation.mutate(
      {
        name: data.name,
        description: data.description || undefined,
        price: parseFloat(data.price),
        duration_minutes: data.duration_minutes
          ? parseInt(data.duration_minutes, 10)
          : 0,
        is_required: data.is_required,
        display_order: data.display_order
          ? parseInt(data.display_order, 10)
          : 0,
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

  if (!option) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Option</DialogTitle>
          <DialogDescription>
            Update the selected service option details.
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
                setValue('service_id', '', {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              disabled={categoriesLoading || updateOptionMutation.isPending}
            >
              <SelectTrigger id="category_id" className="mt-2">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading ? (
                  <SelectItem disabled value="loading">
                    Loading categories...
                  </SelectItem>
                ) : categories.length > 0 ? (
                  categories.map((cat) => (
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
            <Label htmlFor="service_id">Service *</Label>
            <Select
              value={selectedServiceId}
              onValueChange={(value) => {
                setValue('service_id', value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              disabled={
                !selectedCategoryId ||
                servicesLoading ||
                updateOptionMutation.isPending
              }
            >
              <SelectTrigger id="service_id" className="mt-2">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {!selectedCategoryId ? (
                  <SelectItem disabled value="select-category">
                    Please select a category first
                  </SelectItem>
                ) : servicesLoading ? (
                  <SelectItem disabled value="loading">
                    Loading services...
                  </SelectItem>
                ) : filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="none">
                    No services available for this category
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.service_id && (
              <p className="text-sm text-red-500 mt-1">
                {errors.service_id.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="option-name">Option Name *</Label>
            <Input id="option-name" {...register('name')} className="mt-2" />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="option-description">Description</Label>
            <textarea
              id="option-description"
              {...register('description')}
              className="mt-2 w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="option-price">Price (R) *</Label>
              <Input
                id="option-price"
                type="number"
                step="0.01"
                {...register('price')}
                className="mt-2"
              />
              {errors.price && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="option-duration">Duration (Minutes)</Label>
              <Input
                id="option-duration"
                type="number"
                {...register('duration_minutes')}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="option-display">Display Order</Label>
            <Input
              id="option-display"
              type="number"
              {...register('display_order')}
              className="mt-2"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register('is_required')}
              className="h-4 w-4 rounded border-gray-300"
            />
            Required
          </label>

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
              disabled={updateOptionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateOptionMutation.isPending || !isDirty}
            >
              {updateOptionMutation.isPending ? 'Updating...' : 'Update Option'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
