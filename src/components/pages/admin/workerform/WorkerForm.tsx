'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogDescription,
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
import { WorkerFormProps } from '@/lib/types';
import { Service } from '@/lib/types/admin/services';
import { MultiSelect } from '@/components/common/MultiSelect';
import { useCreateWorker, useGetServices } from '@/lib/client/api';
import { workerFormSchema, WorkerFormValues } from '@/lib/validations';

export function WorkerForm({ open, onOpenChange, onSuccess }: WorkerFormProps) {
  const createWorkerMutation = useCreateWorker();
  const { data: services, isLoading: servicesLoading } = useGetServices();
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // No tabs needed, show all fields in one form

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors: formErrors, isDirty },
  } = useForm<WorkerFormValues>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      service_ids: [],
      address: {
        label: 'home',
        recipient_name: '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: 'ZA',
        is_primary: true,
      },
    },
  });

  const isBaseComplete =
    Boolean(watch('full_name')) &&
    Boolean(watch('email')) &&
    Array.isArray(watch('service_ids')) &&
    watch('service_ids').length > 0;

  const isAddressComplete =
    Boolean(watch('address.line1')) &&
    Boolean(watch('address.city')) &&
    Boolean(watch('address.state_province')) &&
    Boolean(watch('address.postal_code')) &&
    Boolean(watch('address.country'));

  const isFormComplete = isBaseComplete && isAddressComplete;

  const onSubmit = async (data: WorkerFormValues) => {
    setIsSubmitting(true);
    try {
      await createWorkerMutation.mutateAsync({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        service_ids: data.service_ids,
        address: {
          ...data.address,
          recipient_name:
            data.address.recipient_name || data.full_name || undefined,
          phone: data.address.phone || data.phone || undefined,
          is_primary: true,
        },
      });

      reset();
      setSelectedServiceIds([]);
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
      <DialogContent className="sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Worker</DialogTitle>
          <DialogDescription>
            Create a new worker account. Workers can accept service bookings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Base Details */}
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-1">
                Full Name *
              </Label>
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
              <Label className="block text-sm font-medium mb-1">Email *</Label>
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
              <Label className="block text-sm font-medium mb-1">Phone</Label>
              <Input
                id="phone"
                placeholder="+27 11 123 4567"
                {...register('phone')}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">
                Services *
              </Label>
              <MultiSelect
                options={
                  (services as Service[] | undefined)?.map((s) => ({
                    label: `${s.name} (${s.base_price}ZAR/${s.category?.charge_type || ''})`,
                    value: s.id,
                  })) || []
                }
                value={selectedServiceIds}
                onChange={(newSelected) => {
                  setSelectedServiceIds(newSelected);
                  setValue('service_ids', newSelected, { shouldDirty: true });
                }}
                placeholder="Select services"
                disabled={servicesLoading || isSubmitting}
              />
              {formErrors.service_ids && (
                <div className="text-xs text-red-500 mt-1">
                  {formErrors.service_ids.message}
                </div>
              )}
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-4 rounded-lg border border-dashed border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Worker Address</Label>
            </div>
            <div>
              <Label className="text-sm">Label</Label>
              <Select
                value={watch('address.label')}
                onValueChange={(value) =>
                  setValue(
                    'address.label',
                    value as WorkerFormValues['address']['label'],
                    {
                      shouldValidate: true,
                    },
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
              {formErrors.address?.phone && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.address.phone.message}
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
              {formErrors.address?.line1 && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.address.line1.message}
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
              {formErrors.address?.city && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.address.city.message}
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
              {formErrors.address?.state_province && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.address.state_province.message}
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
              {formErrors.address?.postal_code && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.address.postal_code.message}
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
              {formErrors.address?.country && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.address.country.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setSelectedServiceIds([]);
                }}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty || !isFormComplete}
            >
              {isSubmitting ? 'Creating...' : 'Create Worker'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
