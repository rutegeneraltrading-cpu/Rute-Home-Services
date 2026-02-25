'use client';

import { useState, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  useGetServices,
  useGetCategories,
  useGetServiceOptions,
  useCreateServiceOption,
  CreateServiceOptionDTO,
} from '@/lib/client/api';
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  ServiceOptionFormValues,
  serviceOptionSchema,
} from '@/lib/validations';
import { ServiceOptionsFormProps } from '@/lib/types';

export function ServiceOptionsForm({
  serviceId: preSelectedServiceId,
  serviceName = 'Service',
}: ServiceOptionsFormProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preSelectedServiceId || '',
  );

  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const { data: allServices, isLoading: servicesLoading } = useGetServices();
  const { data: options, isLoading: optionsLoading } =
    useGetServiceOptions(selectedServiceId);
  const createMutation = useCreateServiceOption(selectedServiceId);

  const selectedService = useMemo(
    () => allServices?.find((s) => s.id === selectedServiceId),
    [allServices, selectedServiceId],
  );

  // Filter services by selected category
  const filteredServices = useMemo(
    () =>
      allServices?.filter(
        (service) => service.category_id === selectedCategoryId,
      ) || [],
    [allServices, selectedCategoryId],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    control,
  } = useForm<ServiceOptionFormValues>({
    resolver: zodResolver(serviceOptionSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      price: '0',
      duration_minutes: '0',
      is_required: false,
      display_order: '0',
      type: '',
    },
  });

  const onSubmit: SubmitHandler<ServiceOptionFormValues> = (data) => {
    const payload: CreateServiceOptionDTO = {
      name: data.name,
      description: data.description || undefined,
      price: parseFloat(data.price),
      duration_minutes: parseInt(data.duration_minutes || '0'),
      is_required: data.is_required,
      display_order: parseInt(data.display_order || '0'),
      type: data.type,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        reset();
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Step 1: Category Selection - Always show */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Select Service Category</CardTitle>
          <CardDescription>
            Choose which category the service belongs to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="category">Service Category *</Label>
          <Select
            value={selectedCategoryId}
            onValueChange={setSelectedCategoryId}
          >
            <SelectTrigger id="category" className="mt-2">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categoriesLoading ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : categories?.categories && categories.categories.length > 0 ? (
                categories.categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No categories available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Step 2: Service Selection - Show when category selected */}
      {selectedCategoryId && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Select Service</CardTitle>
            <CardDescription>
              Choose which service to add options to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="service">Service *</Label>
            <Select
              value={selectedServiceId}
              onValueChange={setSelectedServiceId}
            >
              <SelectTrigger id="service" className="mt-2">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {servicesLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} (R{service.base_price})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No services in this category
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Show form only if service is selected */}
      {!selectedServiceId && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-gray-500">
            {!selectedCategoryId && !preSelectedServiceId ? (
              <p>Please select a category first</p>
            ) : !selectedServiceId ? (
              <p>Please select a service to add options</p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {selectedServiceId && (
        <>
          <div>
            <h2 className="text-2xl font-bold">
              Service Options for {selectedService?.name || serviceName}
            </h2>
            <p className="text-gray-600">
              Add customizable add-ons that customers can select with this
              service.
            </p>
          </div>

          {/* Current Options List */}
          {!optionsLoading && options && options.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Existing Options</CardTitle>
                <CardDescription>
                  Options already added to this service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {options.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{option.name}</p>
                        {option.description && (
                          <p className="text-sm text-gray-500">
                            {option.description}
                          </p>
                        )}
                        <div className="mt-1 flex gap-4 text-sm text-gray-600">
                          <span>+R{option.price.toFixed(2)}</span>
                          {option.duration_minutes > 0 && (
                            <span>+{option.duration_minutes}min</span>
                          )}
                          {option.is_required && (
                            <span className="text-amber-600 font-medium">
                              Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add New Option Form */}
          {selectedServiceId && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Option</CardTitle>
                <CardDescription>
                  Create a new add-on for this service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Option Name */}
                  <div>
                    <Label htmlFor="name">Option Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Washing Machine Clean, Door Cleaning"
                      className="mt-2"
                      disabled={createMutation.isPending}
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.name.message as string}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      placeholder="What does this option include?"
                      rows={3}
                      className="mt-2 w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={createMutation.isPending}
                      {...register('description')}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.description.message as string}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <Label htmlFor="price">Additional Price (ZAR) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      className="mt-2"
                      disabled={createMutation.isPending}
                      {...register('price')}
                    />
                    {errors.price && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.price.message as string}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      How much to add to the base price
                    </p>
                  </div>

                  {/* Duration */}
                  <div>
                    <Label htmlFor="duration_minutes">
                      Additional Duration (Minutes)
                    </Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      placeholder="0"
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
                      How much time this option adds to the service
                    </p>
                  </div>

                  {/* Required Checkbox */}
                  <div className="flex items-center gap-3">
                    <input
                      id="is_required"
                      type="checkbox"
                      className="w-4 h-4 rounded"
                      disabled={createMutation.isPending}
                      {...register('is_required')}
                    />
                    <Label htmlFor="is_required">This option is required</Label>
                  </div>

                  {/* Display Order */}
                  <div>
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      placeholder="0"
                      className="mt-2"
                      disabled={createMutation.isPending}
                      {...register('display_order')}
                    />
                    {errors.display_order && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.display_order.message as string}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Position in the list (0, 1, 2, ...)
                    </p>
                  </div>

                  {/* Type Dropdown (with Controller for react-hook-form) */}
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(val) => field.onChange(val)}
                          disabled={createMutation.isPending}
                        >
                          <SelectTrigger id="type" className="mt-2">
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="core_task">Core Task</SelectItem>
                            <SelectItem value="add_on">Add-on</SelectItem>
                            <SelectItem value="size">Size</SelectItem>
                            <SelectItem value="type">Type</SelectItem>
                            <SelectItem value="property_size">
                              Property Size
                            </SelectItem>
                            <SelectItem value="truck_size">
                              Truck Size
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.type && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.type.message as string}
                      </p>
                    )}
                  </div>

                  {/* Submit Buttons (right aligned, like ServiceCategoryForm) */}
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    {isDirty && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => reset()}
                        disabled={createMutation.isPending}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || !isDirty}
                    >
                      {createMutation.isPending ? 'Adding...' : 'Add Option'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
