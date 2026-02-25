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
import { useCreateWorker, useGetServices } from '@/lib/client/api';
import { workerFormSchema, WorkerFormValues } from '@/lib/validations';

export function WorkerForm({ open, onOpenChange, onSuccess }: WorkerFormProps) {
  const createWorkerMutation = useCreateWorker();
  const { data: services, isLoading: servicesLoading } = useGetServices();
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'base' | 'address'>('base');

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
      service_id: '',
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
    Boolean(watch('service_id'));

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
        service_id: data.service_id,
        address: {
          ...data.address,
          recipient_name:
            data.address.recipient_name || data.full_name || undefined,
          phone: data.address.phone || data.phone || undefined,
          is_primary: true,
        },
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
      <DialogContent className=" sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Worker</DialogTitle>
          <DialogDescription>
            Create a new worker account. Workers can accept service bookings.
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
            </div>
          )}

          {activeTab === 'address' && (
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
          )}
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
