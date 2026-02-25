'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useGetServices, useUpdateWorker } from '@/lib/client/api';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';
import { WorkerEditModalProps } from '@/lib/types';
import { workerEditSchema, WorkerEditValues } from '@/lib/validations';

export function WorkerEditModal({
  open,
  worker,
  onOpenChange,
  onSuccess,
}: WorkerEditModalProps) {
  const updateWorkerMutation = useUpdateWorker(worker?.id || '');
  const { data: services, isLoading: servicesLoading } = useGetServices();
  const [activeTab, setActiveTab] = useState<'base' | 'address'>('base');

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<WorkerEditValues>({
    resolver: zodResolver(workerEditSchema),
  });

  useEffect(() => {
    if (worker) {
      reset({
        full_name: worker.full_name || '',
        phone: worker.phone || '',
        service_id: worker.service_ids?.[0] || '',
        status:
          (worker.status as 'active' | 'inactive' | 'suspended') || 'active',
        address: {
          label: worker.primary_address?.label || 'home',
          recipient_name: worker.primary_address?.recipient_name || '',
          phone: worker.primary_address?.phone || '',
          line1: worker.primary_address?.line1 || '',
          line2: worker.primary_address?.line2 || '',
          city: worker.primary_address?.city || '',
          state_province: worker.primary_address?.state_province || '',
          postal_code: worker.primary_address?.postal_code || '',
          country: worker.primary_address?.country || 'ZA',
          is_primary: true,
        },
      });
    }
  }, [worker, reset]);

  const onSubmit = (data: WorkerEditValues) => {
    if (!worker) return;
    updateWorkerMutation.mutate(
      {
        full_name: data.full_name,
        phone: data.phone || undefined,
        status: data.status,
        service_id: data.service_id,
        address: {
          ...data.address,
          recipient_name:
            data.address.recipient_name || data.full_name || undefined,
          phone: data.address.phone || data.phone || undefined,
          is_primary: true,
        },
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
      },
    );
  };

  if (!worker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Worker</DialogTitle>
          <DialogDescription>
            Update worker details. Role cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="inline-flex rounded-lg border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('base')}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                activeTab === 'base'
                  ? 'bg-white shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Base Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('address')}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                activeTab === 'address'
                  ? 'bg-white shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Address
            </button>
          </div>

          {activeTab === 'base' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Base Details
                </h3>
                <p className="text-xs text-muted-foreground">
                  Worker account information and service assignment.
                </p>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={worker.email}
                  disabled
                  className="mt-2 bg-gray-50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  {...register('full_name')}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+27 11 123 4567"
                  {...register('phone')}
                />
              </div>
              <div>
                <Label htmlFor="service_id">Service *</Label>
                <Controller
                  name="service_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setValue('service_id', value, { shouldDirty: true });
                      }}
                      disabled={servicesLoading}
                    >
                      <SelectTrigger id="service_id" className="mt-2">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {servicesLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading services...
                          </SelectItem>
                        ) : services && services.length > 0 ? (
                          services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No services available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.service_id && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.service_id.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setValue(
                          'status',
                          value as 'active' | 'inactive' | 'suspended',
                          { shouldDirty: true },
                        );
                      }}
                    >
                      <SelectTrigger id="status" className="mt-2">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.status.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="space-y-4 rounded-lg border border-dashed border-gray-200 p-4">
              <div>
                <Label className="text-sm">Label</Label>
                <Select
                  value={watch('address.label')}
                  onValueChange={(value) =>
                    setValue(
                      'address.label',
                      value as WorkerEditValues['address']['label'],
                      { shouldValidate: true, shouldDirty: true },
                    )
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address.recipient_name">Recipient Name</Label>
                <Input
                  id="address.recipient_name"
                  placeholder="Recipient name"
                  {...register('address.recipient_name')}
                />
              </div>

              <div>
                <Label htmlFor="address.phone">Address Phone</Label>
                <Input
                  id="address.phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g., 0111234567"
                  {...register('address.phone')}
                />
                {errors.address?.phone && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.address.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address.line1">Address Line 1 *</Label>
                <Input
                  id="address.line1"
                  placeholder="Street address"
                  {...register('address.line1')}
                />
                {errors.address?.line1 && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.address.line1.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address.line2">Address Line 2</Label>
                <Input
                  id="address.line2"
                  placeholder="Apartment, suite, etc."
                  {...register('address.line2')}
                />
              </div>

              <div>
                <Label htmlFor="address.city">City *</Label>
                <Input
                  id="address.city"
                  placeholder="City"
                  {...register('address.city')}
                />
                {errors.address?.city && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.address.city.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address.state_province">Province/State *</Label>
                <Input
                  id="address.state_province"
                  placeholder="Province or state"
                  {...register('address.state_province')}
                />
                {errors.address?.state_province && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.address.state_province.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address.postal_code">Postal Code *</Label>
                <Input
                  id="address.postal_code"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Postal code"
                  {...register('address.postal_code')}
                />
                {errors.address?.postal_code && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.address.postal_code.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address.country">Country *</Label>
                <Input
                  id="address.country"
                  placeholder="Country"
                  {...register('address.country')}
                />
                {errors.address?.country && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.address.country.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateWorkerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateWorkerMutation.isPending || !isDirty}
            >
              {updateWorkerMutation.isPending ? 'Updating...' : 'Update Worker'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
