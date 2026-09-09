'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, UploadCloud, FileText, X, ChevronLeft } from 'lucide-react';
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
import PhoneInput from 'react-phone-input-2';
import { Service } from '@/lib/types/admin/services';
import { MultiSelect } from '@/components/common/MultiSelect';
import { useCreateWorker, useGetServices } from '@/lib/client/api';
import { workerFormSchema, WorkerFormValues } from '@/lib/validations';
import {
  uploadWorkerAvatarDirect,
  uploadWorkerDocument,
} from '@/lib/client/utils/uploadImage';
import { WorkerStepper } from './WorkerStepper';

const DOC_TYPES = [
  { value: 'identity', label: 'Identity' },
  { value: 'passport', label: 'Passport' },
  { value: 'proof_of_residency', label: 'Proof of Residency' },
  { value: 'business_registration', label: 'Business Registration' },
  { value: 'bank_confirmation', label: 'Bank Confirmation' },
  { value: 'shareholder_id', label: 'Shareholder ID' },
];
const docLabel = (v: string) =>
  DOC_TYPES.find((d) => d.value === v)?.label || v;

const labelCls = 'mb-1 block text-sm font-medium text-slate-700';
const errCls = 'mt-1 text-sm text-red-600';
const phoneInputCls =
  '!h-10 !w-full !rounded-md !border-slate-300 !text-sm !pl-12';

export function WorkerForm({ open, onOpenChange, onSuccess }: WorkerFormProps) {
  const createWorkerMutation = useCreateWorker();
  const { data: services, isLoading: servicesLoading } = useGetServices();
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [documents, setDocuments] = useState<
    Array<{ file: File; type: string }>
  >([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );
  const [profileImageError, setProfileImageError] = useState(false);
  const profileImageRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors: formErrors },
  } = useForm<WorkerFormValues>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      service_ids: [],
      // Admin creates the account on the worker's behalf; the WhatsApp consent
      // checkbox only lives on the public self-registration form, but the shared
      // schema requires this field — default it so submit validation passes.
      whatsappConsent: true,
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

  const handleNext = async () => {
    if (step === 1) {
      if (!profileImage) {
        setProfileImageError(true);
        return;
      }
      const valid = await trigger(
        ['full_name', 'email', 'phone', 'service_ids'],
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

  // Document upload helper — uploads straight to Supabase Storage from the
  // browser to avoid Vercel's ~4.5MB API body limit (FUNCTION_PAYLOAD_TOO_LARGE).
  const uploadDocument = (file: File, type: string) =>
    uploadWorkerDocument(file, type);

  const handleDocumentFile = (file: File | undefined) => {
    if (!file || !selectedDocType) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf')
      return;
    if (file.size > 5 * 1024 * 1024) return;
    setDocuments((prev) => [...prev, { file, type: selectedDocType }]);
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

  const onSubmit = async (data: WorkerFormValues) => {
    setIsSubmitting(true);
    try {
      let avatarUrl: string | undefined;
      if (profileImage) {
        try {
          avatarUrl = await uploadWorkerAvatarDirect(profileImage);
        } catch {
          alert('Image Upload Failed: Could not upload profile image.');
          setIsSubmitting(false);
          return;
        }
      }

      const uploadedDocs: Array<{ type: string; file_url: string }> = [];
      for (const doc of documents) {
        try {
          uploadedDocs.push(await uploadDocument(doc.file, doc.type));
        } catch {
          alert('Document Upload Failed: Could not upload document.');
          setIsSubmitting(false);
          return;
        }
      }

      await createWorkerMutation.mutateAsync({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        service_ids: data.service_ids,
        avatar_url: avatarUrl,
        address: {
          ...data.address,
          recipient_name:
            data.address.recipient_name || data.full_name || undefined,
          phone: data.address.phone || data.phone || undefined,
          is_primary: true,
        },
        documents: uploadedDocs,
      });

      reset();
      setSelectedServiceIds([]);
      setDocuments([]);
      setProfileImage(null);
      setProfileImagePreview(null);
      setStep(1);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating worker:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Surface validation blockers instead of the submit doing nothing silently.
  const onInvalid = (formValidationErrors: Record<string, unknown>) => {
    console.warn('Worker form validation failed:', formValidationErrors);
    const firstMessage = Object.values(formValidationErrors)
      .map((e) =>
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: unknown }).message)
          : '',
      )
      .find(Boolean);
    alert(
      firstMessage
        ? `Please fix: ${firstMessage}`
        : 'Some required fields are missing or invalid. Please review all steps.',
    );
    if (formValidationErrors.full_name || formValidationErrors.email) setStep(1);
    else if (formValidationErrors.address) setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-slate-100 px-6 py-4">
          <DialogTitle className="text-lg">Add new worker</DialogTitle>
          <DialogDescription>
            Create a worker account. Workers can be assigned service bookings
            once verified.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-slate-100 px-6 py-4">
          <WorkerStepper step={step} />
        </div>

        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <button
                    type="button"
                    onClick={() => profileImageRef.current?.click()}
                    className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-white transition-colors hover:border-green-500"
                  >
                    {profileImagePreview ? (
                      <Image
                        src={profileImagePreview}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full flex-col items-center justify-center gap-1 text-slate-400 group-hover:text-green-600">
                        <Camera className="h-5 w-5" />
                        <span className="text-[10px] font-medium">Photo</span>
                      </span>
                    )}
                  </button>
                  <input
                    ref={profileImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith('image/')) return;
                      if (file.size > 5 * 1024 * 1024) return;
                      setProfileImage(file);
                      setProfileImageError(false);
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        setProfileImagePreview(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Profile photo <span className="text-red-500">*</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Use a real, clear face photo. Shown to customers.
                    </p>
                    {profileImagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileImage(null);
                          setProfileImagePreview(null);
                        }}
                        className="mt-1 text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                    {profileImageError && (
                      <p className={errCls}>Please upload a profile photo.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="full_name" className={labelCls}>
                      Full name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      placeholder="John Doe"
                      className="h-10"
                      {...register('full_name')}
                      onChange={(e) => {
                        setValue('full_name', e.target.value, {
                          shouldDirty: true,
                        });
                        trigger('full_name');
                      }}
                    />
                    {formErrors.full_name && (
                      <p className={errCls}>{formErrors.full_name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email" className={labelCls}>
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="h-10"
                      {...register('email')}
                      onChange={(e) => {
                        setValue('email', e.target.value, {
                          shouldDirty: true,
                        });
                        trigger('email');
                      }}
                    />
                    {formErrors.email && (
                      <p className={errCls}>{formErrors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label className={labelCls}>Phone</Label>
                    <PhoneInput
                      country={'za'}
                      inputProps={{ name: 'phone' }}
                      inputClass={phoneInputCls}
                      buttonClass="!border-slate-300 !bg-slate-50"
                      value={watch('phone')}
                      onChange={(value) =>
                        setValue('phone', value, { shouldDirty: true })
                      }
                      enableSearch
                    />
                    {formErrors.phone && (
                      <p className={errCls}>{formErrors.phone.message}</p>
                    )}
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
                        trigger('service_ids');
                      }}
                      placeholder="Select services"
                      disabled={servicesLoading || isSubmitting}
                    />
                    {formErrors.service_ids && (
                      <p className={errCls}>
                        {formErrors.service_ids.message}
                      </p>
                    )}
                  </div>
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
                        value as WorkerFormValues['address']['label'],
                        { shouldValidate: true },
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
                    onChange={(e) => {
                      setValue('address.recipient_name', e.target.value, {
                        shouldDirty: true,
                      });
                      trigger('address.recipient_name');
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="address.phone" className={labelCls}>
                    Address phone <span className="text-red-500">*</span>
                  </Label>
                  <PhoneInput
                    country={'za'}
                    inputProps={{ name: 'address.phone' }}
                    inputClass={phoneInputCls}
                    buttonClass="!border-slate-300 !bg-slate-50"
                    value={watch('address.phone')}
                    onChange={(value) =>
                      setValue('address.phone', value, {
                        shouldDirty: true,
                        shouldValidate: !value,
                      })
                    }
                    enableSearch
                  />
                  {formErrors.address?.phone && (
                    <p className={errCls}>
                      {formErrors.address.phone.message}
                    </p>
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
                    onChange={(e) => {
                      setValue('address.line1', e.target.value, {
                        shouldDirty: true,
                      });
                      trigger('address.line1');
                    }}
                  />
                  {formErrors.address?.line1 && (
                    <p className={errCls}>
                      {formErrors.address.line1.message}
                    </p>
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
                    onChange={(e) => {
                      setValue('address.line2', e.target.value, {
                        shouldDirty: true,
                      });
                      trigger('address.line2');
                    }}
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
                    onChange={(e) => {
                      setValue('address.country', e.target.value, {
                        shouldDirty: true,
                      });
                      trigger('address.country');
                    }}
                  />
                  {formErrors.address?.country && (
                    <p className={errCls}>
                      {formErrors.address.country.message}
                    </p>
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
                    onChange={(e) => {
                      setValue('address.state_province', e.target.value, {
                        shouldDirty: true,
                      });
                      trigger('address.state_province');
                    }}
                  />
                  {formErrors.address?.state_province && (
                    <p className={errCls}>
                      {formErrors.address.state_province.message}
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
                    onChange={(e) => {
                      setValue('address.city', e.target.value, {
                        shouldDirty: true,
                      });
                      trigger('address.city');
                    }}
                  />
                  {formErrors.address?.city && (
                    <p className={errCls}>{formErrors.address.city.message}</p>
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
                    onChange={(e) => {
                      setValue('address.postal_code', e.target.value, {
                        shouldDirty: true,
                      });
                      trigger('address.postal_code');
                    }}
                  />
                  {formErrors.address?.postal_code && (
                    <p className={errCls}>
                      {formErrors.address.postal_code.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
                  Attach at least one verification document (image or PDF, up to
                  5MB each).
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label className={labelCls}>Document type</Label>
                    <Select
                      value={selectedDocType}
                      onValueChange={(value) => setSelectedDocType(value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOC_TYPES.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    disabled={!selectedDocType || isSubmitting}
                    onClick={() => documentInputRef.current?.click()}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={!selectedDocType}
                    onChange={(e) => handleDocumentFile(e.target.files?.[0])}
                  />
                </div>

                {documents.length > 0 && (
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {documents.map((doc, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 p-3 text-sm"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          {doc.file.type.startsWith('image/') ? (
                            <Camera className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-slate-800">
                            {doc.file.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {docLabel(doc.type)} ·{' '}
                            {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </span>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() =>
                            setDocuments((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          disabled={isSubmitting}
                          aria-label="Remove document"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
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
              <Button
                type="submit"
                className="px-6"
                disabled={
                  isSubmitting ||
                  documents.length === 0 ||
                  documents.some((doc) => !doc.type || !doc.file)
                }
              >
                {isSubmitting ? 'Creating…' : 'Create worker'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
