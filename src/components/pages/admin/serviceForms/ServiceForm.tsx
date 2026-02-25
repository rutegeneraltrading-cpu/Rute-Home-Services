'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
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
import { useGetCategories, useCreateService } from '@/lib/client/api';
import type { CreateServiceDTO } from '@/lib/client/api/services';
import { serviceSchema } from '@/lib/validations';
import { ServiceFormProps, ServiceFormValues } from '@/lib/types';

export function ServiceForm({ onServiceCreated }: ServiceFormProps) {
  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const createMutation = useCreateService();

  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      category_id: '',
      name: '',
      slug: '',
      description: '',
      base_price: '0',
      duration_minutes: '60',
    },
  });

  const onSubmit: SubmitHandler<ServiceFormValues> = (data) => {
    const payload: CreateServiceDTO = {
      name: data.name,
      slug: data.slug,
      description: data.description || undefined,
      base_price: parseFloat(data.base_price),
      category_id: data.category_id,
      duration_minutes: parseInt(data.duration_minutes || '60'),
    };

    createMutation.mutate(payload, {
      onSuccess: (service) => {
        // Clear form after success
        reset();
        setSelectedCategoryId('');

        if (onServiceCreated) {
          onServiceCreated(service.id);
        }
      },
    });
  };

  return (
    <div className="bg-card md:border md:rounded-lg md:p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Category - FIRST FIELD */}
        <div>
          <Label htmlFor="category_id">Service Category *</Label>
          <Select
            value={selectedCategoryId}
            onValueChange={(value) => {
              setSelectedCategoryId(value);
              setValue('category_id', value, { shouldValidate: true });
            }}
            disabled={categoriesLoading || createMutation.isPending}
          >
            <SelectTrigger id="category_id" className="mt-2">
              <SelectValue placeholder="Select a category first" />
            </SelectTrigger>
            <SelectContent>
              {categoriesLoading ? (
                <SelectItem disabled value="loading">
                  Loading categories...
                </SelectItem>
              ) : categories?.categories && categories.categories.length > 0 ? (
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
              {errors.category_id.message as string}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Choose which category this service belongs to
          </p>
        </div>

        {/* Service Name */}
        <div>
          <Label htmlFor="name">Service Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Basic House Clean, Deep Clean"
            className="mt-2"
            disabled={createMutation.isPending}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">
              {errors.name.message as string}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            What is this service called?
          </p>
        </div>

        {/* Slug */}
        <div>
          <Label htmlFor="slug">Slug (SEO) *</Label>
          <Input
            id="slug"
            placeholder="e.g., basic-house-clean"
            className="mt-2"
            disabled={createMutation.isPending}
            {...register('slug')}
          />
          {errors.slug && (
            <p className="text-sm text-red-500 mt-1">
              {errors.slug.message as string}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            URL-friendly identifier (e.g., basic-house-clean)
          </p>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            placeholder="Describe what this service includes..."
            rows={4}
            className="mt-2 w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={createMutation.isPending}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">
              {errors.description.message as string}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Brief description of the service
          </p>
        </div>

        {/* Base Price */}
        <div>
          <Label htmlFor="base_price">Base Price (ZAR) *</Label>
          <Input
            id="base_price"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0"
            className="mt-2"
            disabled={createMutation.isPending}
            {...register('base_price')}
          />
          {errors.base_price && (
            <p className="text-sm text-red-500 mt-1">
              {errors.base_price.message as string}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Starting price. Options can add to this.
          </p>
        </div>

        {/* Duration */}
        <div>
          <Label htmlFor="duration_minutes">Duration (Minutes) *</Label>
          <Input
            id="duration_minutes"
            type="number"
            placeholder="60"
            min="1"
            className="mt-2"
            disabled={createMutation.isPending}
            {...register('duration_minutes')}
          />
          {errors.duration_minutes && (
            <p className="text-sm text-red-500 mt-1">
              {errors.duration_minutes.message as string}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Base duration in minutes (default: 60)
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSelectedCategoryId('');
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={createMutation.isPending || !isDirty}>
            {createMutation.isPending ? 'Creating...' : 'Create Service'}
          </Button>
        </div>
      </form>
    </div>
  );
}
