'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { useUpdateWorker, useGetServices } from '@/lib/client/api';
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

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<WorkerEditValues>({
    resolver: zodResolver(workerEditSchema),
  });

  useEffect(() => {
    if (worker) {
      reset({
        full_name: worker.full_name || '',
        phone: worker.phone || '',
        address: worker.address || '',
        hourly_rate: worker.hourly_rate ? String(worker.hourly_rate) : '',
        service_id: worker.service_ids?.[0] || '',
        status:
          (worker.status as 'active' | 'inactive' | 'suspended') || 'active',
      });
    }
  }, [worker, reset]);

  const onSubmit = (data: WorkerEditValues) => {
    if (!worker) return;
    updateWorkerMutation.mutate(
      {
        full_name: data.full_name,
        phone: data.phone || undefined,
        address: data.address || undefined,
        hourly_rate: data.hourly_rate
          ? parseFloat(data.hourly_rate)
          : undefined,
        status: data.status,
        service_id: data.service_id,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Worker</DialogTitle>
          <DialogDescription>
            Update worker details. Role cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="123 Main St, Johannesburg"
              {...register('address')}
            />
          </div>

          <div>
            <Label htmlFor="hourly_rate">Hourly Rate (ZAR)</Label>
            <Input
              id="hourly_rate"
              type="number"
              placeholder="250"
              {...register('hourly_rate')}
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
                      {
                        shouldDirty: true,
                      },
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
