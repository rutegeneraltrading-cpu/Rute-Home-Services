'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
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
import { useGetCategories } from '@/lib/client/api/services/categories.query';
import { useGetServices } from '@/lib/client/api/services/services.query';
import { toast } from 'sonner';

const optionEditSchema = z.object({
  category_id: z.string().min(1, 'Please select a service category'),
  service_id: z.string().min(1, 'Please select a service'),
  name: z.string().min(2, 'Option name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  duration_minutes: z.string().optional(),
  is_required: z.boolean(),
  display_order: z.string().optional(),
  is_active: z.boolean(),
});

type OptionEditValues = z.infer<typeof optionEditSchema>;

interface ServiceOptionItem {
  id: string;
  service_id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes?: number | null;
  is_required?: boolean;
  display_order?: number | null;
  is_active?: boolean;
}

interface ServiceOptionEditModalProps {
  open: boolean;
  option: ServiceOptionItem | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ServiceOptionEditModal({
  open,
  option,
  onOpenChange,
  onSuccess,
}: ServiceOptionEditModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategories();
  const { data: servicesData, isLoading: servicesLoading } = useGetServices();

  const categories = categoriesData?.categories || [];
  const allServices = useMemo(() => servicesData || [], [servicesData]);

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
      category_id: '',
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
    [option],
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
    if (option && allServices.length > 0) {
      // Find the service this option belongs to
      const service = allServices.find((s) => s.id === option.service_id);
      if (service) {
        setSelectedCategoryId(service.category_id);
        setSelectedServiceId(option.service_id);
        reset({
          ...defaultValues,
          category_id: service.category_id,
          service_id: option.service_id,
        });
      }
    }
  }, [option, allServices, reset, defaultValues]);

  const onSubmit = async (data: OptionEditValues) => {
    if (!option) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/services/options/${option.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: data.service_id,
          name: data.name,
          description: data.description || null,
          price: parseFloat(data.price),
          duration_minutes: data.duration_minutes
            ? parseInt(data.duration_minutes, 10)
            : 0,
          is_required: data.is_required,
          display_order: data.display_order
            ? parseInt(data.display_order, 10)
            : 0,
          is_active: data.is_active,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update option');
      }

      // Invalidate queries for both the old and new service
      await queryClient.invalidateQueries({
        queryKey: ['serviceOptions', option.service_id],
      });
      if (data.service_id !== option.service_id) {
        await queryClient.invalidateQueries({
          queryKey: ['serviceOptions', data.service_id],
        });
      }
      toast.success('Option updated successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update option';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
                setSelectedCategoryId(value);
                setSelectedServiceId('');
                setValue('category_id', value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setValue('service_id', '', {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              disabled={categoriesLoading || isSubmitting}
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
                setSelectedServiceId(value);
                setValue('service_id', value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              disabled={!selectedCategoryId || servicesLoading || isSubmitting}
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Updating...' : 'Update Option'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
