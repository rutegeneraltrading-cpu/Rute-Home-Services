'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateWorker } from '@/lib/client/api/workers/workers.mutation';
import { useGetServices } from '@/lib/client/api/services/services.query';

const workerFormSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  service_id: z.string().min(1, 'Please select a service'),
  hourly_rate: z.string().optional(),
});

type WorkerFormValues = z.infer<typeof workerFormSchema>;

interface WorkerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WorkerForm({ open, onOpenChange, onSuccess }: WorkerFormProps) {
  const createWorkerMutation = useCreateWorker();
  const { data: services, isLoading: servicesLoading } = useGetServices();
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors: formErrors, isDirty },
  } = useForm<WorkerFormValues>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      address: '',
      service_id: '',
      hourly_rate: '',
    },
  });

  const onSubmit = async (data: WorkerFormValues) => {
    setIsSubmitting(true);
    try {
      await createWorkerMutation.mutateAsync({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        service_id: data.service_id,
        hourly_rate: data.hourly_rate
          ? parseFloat(data.hourly_rate)
          : undefined,
      });

      reset();
      setSelectedServiceId('');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating worker:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Worker</DialogTitle>
          <DialogDescription>
            Create a new worker account. Workers can accept service bookings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              placeholder="John Doe"
              {...register('full_name')}
            />
            {formErrors.full_name && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.full_name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register('email')}
            />
            {formErrors.email && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.email.message}
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
            <p className="text-xs text-muted-foreground mt-1">
              Optional - worker&apos;s contact number
            </p>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="123 Main St, Johannesburg"
              {...register('address')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional - service area address
            </p>
          </div>

          <div>
            <Label htmlFor="service_id">Service *</Label>
            <Select
              value={selectedServiceId}
              onValueChange={(value) => {
                setSelectedServiceId(value);
                setValue('service_id', value, { shouldValidate: true });
              }}
              disabled={servicesLoading || isSubmitting}
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
                      {service.name} (R{service.base_price})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No services available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {formErrors.service_id && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.service_id.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="hourly_rate">Hourly Rate (ZAR)</Label>
            <Input
              id="hourly_rate"
              type="number"
              placeholder="250"
              {...register('hourly_rate')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional - default rate per hour
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setSelectedServiceId('');
                }}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Add Worker'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
