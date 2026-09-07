'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, FileText, ExternalLink } from 'lucide-react';
import { Service } from '@/lib/types/admin/services';
import { MultiSelect } from '@/components/common/MultiSelect';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PhoneInput from 'react-phone-input-2';
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
import { WorkerStepper } from './WorkerStepper';

const labelCls = 'mb-1 block text-sm font-medium text-slate-700';
const errCls = 'mt-1 text-sm text-red-600';
const phoneInputCls =
  '!h-10 !w-full !rounded-md !border-slate-300 !text-sm !pl-12';

const STATUS_BADGE: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
};

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
      if (worker.worker_documents) {
        const initialStatuses: { [docId: string]: string } = {};
        worker.worker_documents.forEach((doc: any) => {
          if (doc.id) initialStatuses[doc.id] = doc.status;
        });
        setDocumentStatuses(initialStatuses);
      }
      setStep(1);
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
          'address.phone',
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
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
              {worker.avatar_url ? (
                <Image
                  src={worker.avatar_url}
                  alt={worker.full_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
                  {worker.full_name?.charAt(0)?.toUpperCase() || 'W'}
                </span>
              )}
            </span>
            <div>
              <DialogTitle className="text-lg leading-tight">
                Edit worker
              </DialogTitle>
              <DialogDescription className="text-xs">
                {worker.email} · role cannot be changed
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-b border-slate-100 px-6 py-4">
          <WorkerStepper step={step} />
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {/* Step 1 */}
            {step === 1 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="full_name" className={labelCls}>
                    Full name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    className="h-10"
                    autoComplete="off"
                    {...register('full_name')}
                  />
                  {errors.full_name && (
                    <p className={errCls}>{errors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email" className={labelCls}>
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={worker.email}
                    disabled
                    className="h-10 bg-slate-50"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className={labelCls}>
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+27 11 123 4567"
                    className="h-10"
                    {...register('phone')}
                  />
                </div>
                <div>
                  <Label className={labelCls}>
                    Services <span className="text-red-500">*</span>
                  </Label>
                  <MultiSelect
                    options={
                      (services as Service[] | undefined)?.map((s) => ({
                        label: `${s.name} (${s.base_price} ZAR/${s.category?.charge_type || ''})`,
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
                    <p className={errCls}>{errors.service_ids.message}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="status" className={labelCls}>
                    Account status <span className="text-red-500">*</span>
                  </Label>
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
                        <SelectTrigger id="status" className="h-10 w-full">
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
                    <p className={errCls}>{errors.status.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className={labelCls}>Address label</Label>
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
                    <SelectTrigger className="h-10 w-full">
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
                  <Label htmlFor="address.recipient_name" className={labelCls}>
                    Recipient name
                  </Label>
                  <Input
                    id="address.recipient_name"
                    placeholder="Recipient name"
                    className="h-10"
                    {...register('address.recipient_name')}
                  />
                </div>
                <div>
                  <Label htmlFor="address.phone" className={labelCls}>
                    Address phone <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="address.phone"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        country={'za'}
                        inputProps={{ name: field.name }}
                        inputClass={phoneInputCls}
                        buttonClass="!border-slate-300 !bg-slate-50"
                        value={field.value || ''}
                        onChange={(value) => field.onChange(value)}
                        onBlur={field.onBlur}
                        enableSearch
                      />
                    )}
                  />
                  {errors.address?.phone && (
                    <p className={errCls}>{errors.address.phone.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="address.line1" className={labelCls}>
                    Address line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address.line1"
                    placeholder="Street address"
                    className="h-10"
                    {...register('address.line1')}
                  />
                  {errors.address?.line1 && (
                    <p className={errCls}>{errors.address.line1.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="address.line2" className={labelCls}>
                    Address line 2
                  </Label>
                  <Input
                    id="address.line2"
                    placeholder="Apartment, suite, etc."
                    className="h-10"
                    {...register('address.line2')}
                  />
                </div>
                <div>
                  <Label htmlFor="address.country" className={labelCls}>
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address.country"
                    placeholder="Country"
                    className="h-10"
                    {...register('address.country')}
                  />
                  {errors.address?.country && (
                    <p className={errCls}>{errors.address.country.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="address.state_province" className={labelCls}>
                    Province / State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address.state_province"
                    placeholder="Province or state"
                    className="h-10"
                    {...register('address.state_province')}
                  />
                  {errors.address?.state_province && (
                    <p className={errCls}>
                      {errors.address.state_province.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="address.city" className={labelCls}>
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address.city"
                    placeholder="City"
                    className="h-10"
                    {...register('address.city')}
                  />
                  {errors.address?.city && (
                    <p className={errCls}>{errors.address.city.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="address.postal_code" className={labelCls}>
                    Postal code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address.postal_code"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Postal code"
                    className="h-10"
                    {...register('address.postal_code')}
                  />
                  {errors.address?.postal_code && (
                    <p className={errCls}>
                      {errors.address.postal_code.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4">
                {worker.worker_documents &&
                worker.worker_documents.length > 0 ? (
                  <>
                    <p className="text-xs text-slate-500">
                      Review each document and set its verification status.
                    </p>
                    {worker.worker_documents.map((doc: any, idx: number) => {
                      const currentStatus =
                        documentStatuses[doc.id] || doc.status;
                      const isImage = doc.file_url?.match(
                        /\.(jpg|jpeg|png|gif|bmp|webp)$/i,
                      );
                      return (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium capitalize text-slate-800">
                                {String(doc.document_type).replace(/_/g, ' ')}
                              </p>
                              <span
                                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                                  STATUS_BADGE[currentStatus] ||
                                  'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {currentStatus}
                              </span>
                            </div>
                            <div className="w-40 shrink-0">
                              <Select
                                value={currentStatus}
                                onValueChange={(value) =>
                                  setDocumentStatuses((prev) => ({
                                    ...prev,
                                    [doc.id]: value,
                                  }))
                                }
                                disabled={isSubmitting}
                              >
                                <SelectTrigger className="h-9 w-full">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">
                                    Pending
                                  </SelectItem>
                                  <SelectItem value="approved">
                                    Approved
                                  </SelectItem>
                                  <SelectItem value="rejected">
                                    Rejected
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {doc.file_url &&
                            (isImage ? (
                              <div className="relative mt-3 h-48 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                <Image
                                  src={doc.file_url}
                                  alt={doc.document_type}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <FileText className="h-4 w-4" />
                                View document
                                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                              </a>
                            ))}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                    No documents uploaded for this worker.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={isSubmitting}
                className="text-slate-600"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-6"
              >
                Continue
              </Button>
            ) : (
              <Button type="submit" className="px-6" disabled={isSubmitting}>
                {isSubmitting ? 'Updating…' : 'Save changes'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
