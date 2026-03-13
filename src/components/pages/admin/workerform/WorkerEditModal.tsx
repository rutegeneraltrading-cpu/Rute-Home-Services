'use client';

import { useEffect, useState } from 'react';
import { Service } from '@/lib/types/admin/services';
import { MultiSelect } from '@/components/common/MultiSelect';
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
import Image from 'next/image';

export function WorkerEditModal({
  open,
  worker,
  onOpenChange,
  onSuccess,
}: WorkerEditModalProps) {
  const updateWorkerMutation = useUpdateWorker(worker?.id || '');
  const { data: services, isLoading: servicesLoading } = useGetServices();
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    worker?.service_ids || [],
  );
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track document statuses
  const [documentStatuses, setDocumentStatuses] = useState<{
    [docId: string]: string;
  }>({});

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<WorkerEditValues>({
    resolver: zodResolver(workerEditSchema),
  });

  useEffect(() => {
    if (worker) {
      reset({
        full_name: worker.full_name || '',
        phone: worker.phone || '',
        service_ids: worker.service_ids || [],
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
      setSelectedServiceIds(worker.service_ids || []);
      // Initialize documentStatuses from worker.worker_documents
      if (worker.worker_documents) {
        const initialStatuses: { [docId: string]: string } = {};
        worker.worker_documents.forEach((doc: any) => {
          if (doc.id) initialStatuses[doc.id] = doc.status;
        });
        setDocumentStatuses(initialStatuses);
      }
    }
  }, [worker, reset]);

  const handleNext = async () => {
    if (step === 1) {
      const valid = await trigger(
        ['full_name', 'phone', 'service_ids', 'status'],
        { shouldFocus: true },
      );
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await trigger(
        [
          'address.label',
          'address.line1',
          'address.city',
          'address.state_province',
          'address.postal_code',
          'address.country',
        ],
        { shouldFocus: true },
      );
      if (valid) setStep(3);
    }
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = async (data: WorkerEditValues) => {
    if (!worker) return;
    setIsSubmitting(true);
    try {
      // Prepare worker_documents status updates
      let workerDocumentsPayload: Array<{ id: string; status: string }> = [];
      if (worker.worker_documents && Object.keys(documentStatuses).length > 0) {
        workerDocumentsPayload = worker.worker_documents.map((doc: any) => ({
          id: doc.id,
          status: documentStatuses[doc.id] || doc.status,
        }));
      }
      await updateWorkerMutation.mutateAsync({
        full_name: data.full_name,
        phone: data.phone || undefined,
        status: data.status,
        service_ids: data.service_ids,
        address: {
          ...data.address,
          recipient_name:
            data.address.recipient_name || data.full_name || undefined,
          phone: data.address.phone || data.phone || undefined,
          is_primary: true,
        },
        worker_documents: workerDocumentsPayload,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating worker:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!worker) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Worker</DialogTitle>
          <DialogDescription>
            Update worker details. Role cannot be changed.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper UI */}
        <div className="flex items-center justify-between mb-8">
          <div
            className={`flex-1 text-center ${step === 1 ? 'font-bold text-primary' : 'text-muted-foreground'}`}
          >
            1. Base Info
          </div>
          <div className="w-8 h-0.5 bg-gray-300 mx-2" />
          <div
            className={`flex-1 text-center ${step === 2 ? 'font-bold text-primary' : 'text-muted-foreground'}`}
          >
            2. Address
          </div>
          <div className="w-8 h-0.5 bg-gray-300 mx-2" />
          <div
            className={`flex-1 text-center ${step === 3 ? 'font-bold text-primary' : 'text-muted-foreground'}`}
          >
            3. Documents
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Base Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  {...register('full_name')}
                  className="mt-2"
                  autoComplete="off"
                />
                {errors.full_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.full_name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={worker.email}
                  disabled
                  className="mt-2 bg-gray-50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
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
                    setValue('service_ids', newSelected, {
                      shouldDirty: true,
                    });
                  }}
                  placeholder="Select services"
                  disabled={servicesLoading || updateWorkerMutation.isPending}
                />
                {errors.service_ids && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.service_ids.message}
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

          {/* Step 2: Address Info */}
          {step === 2 && (
            <div className="space-y-4 rounded-lg border border-dashed border-gray-200 p-4">
              <div>
                <Label className="text-sm">Label</Label>
                <Select
                  value={watch('address.label')}
                  onValueChange={(value) =>
                    setValue(
                      'address.label',
                      value as WorkerEditValues['address']['label'],
                      {
                        shouldValidate: true,
                        shouldDirty: true,
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

          {/* Step 3: Document Upload */}
          {step === 3 && (
            <div className="rounded-lg border border-dashed border-gray-200 p-4">
              {worker?.worker_documents &&
                worker.worker_documents.length > 0 && (
                  <div>
                    <div className="space-y-4">
                      {worker.worker_documents.map((doc: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-2">
                          {/* Status Select */}
                          <div>
                            <Label htmlFor={`doc-status-${idx}`}>Status</Label>
                            <Select
                              value={documentStatuses[doc.id] || doc.status}
                              onValueChange={(value) => {
                                setDocumentStatuses((prev) => ({
                                  ...prev,
                                  [doc.id]: value,
                                }));
                              }}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger
                                id={`doc-status-${idx}`}
                                className="mt-1"
                              >
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">
                                  Approved
                                </SelectItem>
                                <SelectItem value="rejected">
                                  Rejected
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="font-medium text-sm mt-2">
                            Document Type: {doc.document_type}
                          </div>
                          {/* File Preview */}
                          {doc.file_url &&
                          doc.file_url.match(
                            /\.(jpg|jpeg|png|gif|bmp|webp)$/i,
                          ) ? (
                            <Image
                              src={doc.file_url}
                              alt={doc.document_type}
                              width={400}
                              height={400}
                              className="w-full object-cover rounded border mt-2"
                            />
                          ) : (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline text-blue-600 mt-2"
                            >
                              View File
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Worker Documents List & Status Update (always visible for admin) */}
          {/* ...existing code... */}

          {/* Navigation Buttons */}
          <div
            className={`flex justify-between gap-3 pt-4 ${step === 1 ? 'justify-end' : 'justify-between'}`}
          >
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6"
              >
                Back
              </Button>
            )}
            {step < 3 && (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-6"
              >
                Next
              </Button>
            )}
            {step === 3 && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update Worker'
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
