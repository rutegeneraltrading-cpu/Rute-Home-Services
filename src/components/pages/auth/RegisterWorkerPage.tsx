'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PhoneInput from 'react-phone-input-2';
import {
  Camera,
  Check,
  UploadCloud,
  FileText,
  X,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Service, DocumentType } from '@/lib/types';
import { MultiSelect } from '@/components/common/MultiSelect';
import { useCreateWorker, useGetServices } from '@/lib/client/api';
import { WorkerFormValues, workerFormSchema } from '@/lib/validations';
import {
  uploadWorkerAvatarDirect,
  uploadWorkerDocument,
} from '@/lib/client/utils/uploadImage';

const STEPS = [
  { id: 1, title: 'Your details', hint: 'Personal info & services' },
  { id: 2, title: 'Address', hint: 'Where you are based' },
  { id: 3, title: 'Documents', hint: 'Verify your identity' },
] as const;

const DOC_TYPE_LABELS: Record<string, string> = {
  [DocumentType.Identity]: 'Identity',
  [DocumentType.Passport]: 'Passport',
  [DocumentType.ProofOfResidency]: 'Proof of Residency',
  [DocumentType.BusinessRegistration]: 'Business Registration',
  [DocumentType.BankConfirmation]: 'Bank Confirmation',
  [DocumentType.ShareholderId]: 'Shareholder ID',
};

const fieldError = 'mt-1 text-sm text-red-600';
const fieldLabel = 'mb-1 block text-sm font-medium text-slate-700';

const RegisterWorkerPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const createWorkerMutation = useCreateWorker();
  const { data: services, isLoading: servicesLoading } = useGetServices();
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | ''>('');
  const [documents, setDocuments] = useState<
    Array<{ file: File; type: DocumentType }>
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
      whatsappConsent: false,
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

  const handleNext = async () => {
    if (step === 1) {
      if (!profileImage) {
        setProfileImageError(true);
        return;
      }
      const valid = await trigger(
        ['full_name', 'email', 'phone', 'whatsappConsent', 'service_ids'],
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

  // Upload documents directly to Supabase Storage from the browser.
  // (Routing through an API endpoint hits Vercel's ~4.5MB body limit -> 413.)
  const uploadDocument = (file: File, type: DocumentType) =>
    uploadWorkerDocument(file, type);

  const handleDocumentFile = (file: File | undefined) => {
    if (!file || !selectedDocType) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Invalid file',
        description: 'Please upload an image or PDF.',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Documents must be less than 5MB.',
      });
      return;
    }
    setDocuments((prev) => [
      ...prev,
      { file, type: selectedDocType as DocumentType },
    ]);
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
          toast({
            title: 'Image upload failed',
            description: 'Could not upload profile photo.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }

      const uploadedDocs: Array<{ type: string; file_url: string }> = [];
      for (const doc of documents) {
        try {
          uploadedDocs.push(await uploadDocument(doc.file, doc.type));
        } catch {
          toast({
            title: 'Document upload failed',
            description: 'Could not upload one of your documents.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }

      await createWorkerMutation.mutateAsync({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        service_ids: data.service_ids,
        profile_status: 'inactive',
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

      toast({
        title: 'Application submitted',
        description: 'Your worker account is now under review.',
      });
      reset();
      setSelectedServiceIds([]);
      setDocuments([]);
      setProfileImage(null);
      setProfileImagePreview(null);
      router.push('/');
    } catch (error) {
      console.error('Error creating worker:', error);
      toast({
        title: 'Something went wrong',
        description: (error as Error)?.message || 'Failed to create worker.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (formValidationErrors: Record<string, unknown>) => {
    console.warn('Worker registration validation failed:', formValidationErrors);
    const firstMessage = Object.values(formValidationErrors)
      .map((e) =>
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: unknown }).message)
          : '',
      )
      .find(Boolean);
    toast({
      variant: 'destructive',
      title: 'Please review your details',
      description:
        firstMessage ||
        'Some required fields are missing or invalid. Check every step.',
    });
    if (
      formValidationErrors.full_name ||
      formValidationErrors.email ||
      formValidationErrors.phone ||
      formValidationErrors.service_ids ||
      formValidationErrors.whatsappConsent
    ) {
      setStep(1);
    } else if (formValidationErrors.address) {
      setStep(2);
    }
  };

  return (
    <div className="w-full max-w-2xl py-6 md:py-10">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-6 sm:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Join the RUTE network
          </span>
          <h1 className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
            Become a RUTE service provider
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete the steps below. Your application is reviewed before your
            account goes live.
          </p>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-6 sm:px-8">
          <ol className="flex items-center">
            {STEPS.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <li
                  key={s.id}
                  className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                        done
                          ? 'border-green-600 bg-green-600 text-white'
                          : active
                            ? 'border-green-600 bg-white text-green-700'
                            : 'border-slate-300 bg-white text-slate-400'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : s.id}
                    </span>
                    <div className="hidden sm:block">
                      <p
                        className={`text-sm font-medium leading-none ${
                          active || done ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {s.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{s.hint}</p>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-3 h-0.5 flex-1 rounded ${
                        done ? 'bg-green-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-sm font-medium text-slate-900 sm:hidden">
            Step {step} of {STEPS.length} — {STEPS[step - 1].title}
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="px-6 py-6 sm:px-8"
        >
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Profile photo */}
              <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:gap-5">
                <button
                  type="button"
                  onClick={() => profileImageRef.current?.click()}
                  className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-white transition-colors hover:border-green-500"
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
                      <Camera className="h-6 w-6" />
                      <span className="text-[11px] font-medium">Add photo</span>
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
                    if (!file.type.startsWith('image/')) {
                      toast({
                        variant: 'destructive',
                        title: 'Invalid file',
                        description: 'Please select an image file.',
                      });
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      toast({
                        variant: 'destructive',
                        title: 'File too large',
                        description: 'Image must be less than 5MB.',
                      });
                      return;
                    }
                    setProfileImage(file);
                    setProfileImageError(false);
                    const reader = new FileReader();
                    reader.onload = (ev) =>
                      setProfileImagePreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
                <div className="text-center sm:text-left">
                  <p className="text-sm font-medium text-slate-900">
                    Profile photo <span className="text-red-500">*</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Use a real, clear photo of your face. This is shown to
                    customers and is important for trust.
                  </p>
                  {profileImagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileImage(null);
                        setProfileImagePreview(null);
                      }}
                      className="mt-2 text-xs font-medium text-red-600 hover:underline"
                    >
                      Remove photo
                    </button>
                  )}
                  {profileImageError && (
                    <p className={fieldError}>Please upload a profile photo.</p>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="full_name" className={fieldLabel}>
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
                    <p className={fieldError}>{formErrors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className={fieldLabel}>
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className="h-10"
                    {...register('email')}
                    onChange={(e) => {
                      setValue('email', e.target.value, { shouldDirty: true });
                      trigger('email');
                    }}
                  />
                  {formErrors.email && (
                    <p className={fieldError}>{formErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className={fieldLabel}>
                    Phone
                  </Label>
                  <PhoneInput
                    country={'za'}
                    inputProps={{ name: 'phone' }}
                    inputClass="!h-10 !w-full !rounded-md !border-slate-300 !text-sm"
                    buttonClass="!border-slate-300 !bg-slate-50"
                    value={watch('phone')}
                    onChange={(value) =>
                      setValue('phone', value, { shouldDirty: true })
                    }
                    enableSearch
                  />
                  {formErrors.phone && (
                    <p className={fieldError}>{formErrors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label className={fieldLabel}>
                    Services you offer <span className="text-red-500">*</span>
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
                    <p className={fieldError}>
                      {formErrors.service_ids.message}
                    </p>
                  )}
                </div>
              </div>

              {/* WhatsApp consent */}
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-xs leading-relaxed text-slate-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-green-600"
                  checked={watch('whatsappConsent') || false}
                  onChange={(e) => {
                    setValue('whatsappConsent', e.target.checked, {
                      shouldDirty: true,
                    });
                    trigger('whatsappConsent');
                  }}
                />
                <span>
                  Yes, sign me up to receive WhatsApp messages from Rute Home
                  Services about job assignments and booking updates. Message
                  frequency varies. Message and data rates may apply. Reply STOP
                  to opt out or HELP for help. See our{' '}
                  <Link
                    href="/terms-and-conditions"
                    className="font-medium underline"
                  >
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy-policy" className="font-medium underline">
                    Privacy Policy
                  </Link>
                  .
                  {formErrors.whatsappConsent && (
                    <span className="mt-1 block text-red-600">
                      {formErrors.whatsappConsent.message}
                    </span>
                  )}
                </span>
              </label>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label className={fieldLabel}>Address label</Label>
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
                <Label htmlFor="address.recipient_name" className={fieldLabel}>
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
                {formErrors.address?.recipient_name && (
                  <p className={fieldError}>
                    {formErrors.address.recipient_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address.phone" className={fieldLabel}>
                  Address phone <span className="text-red-500">*</span>
                </Label>
                <PhoneInput
                  country={'za'}
                  inputProps={{ name: 'address.phone' }}
                  inputClass="!h-10 !w-full !rounded-md !border-slate-300 !text-sm"
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
                  <p className={fieldError}>
                    {formErrors.address.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address.line1" className={fieldLabel}>
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
                  <p className={fieldError}>
                    {formErrors.address.line1.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address.line2" className={fieldLabel}>
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
                <Label htmlFor="address.country" className={fieldLabel}>
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
                  <p className={fieldError}>
                    {formErrors.address.country.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address.state_province" className={fieldLabel}>
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
                  <p className={fieldError}>
                    {formErrors.address.state_province.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address.city" className={fieldLabel}>
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
                  <p className={fieldError}>
                    {formErrors.address.city.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address.postal_code" className={fieldLabel}>
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
                  <p className={fieldError}>
                    {formErrors.address.postal_code.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
                Upload at least one identity document. Accepted formats: image or
                PDF, up to 5MB each. All documents are kept private and used for
                verification only.
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <Label className={fieldLabel}>Document type</Label>
                  <Select
                    value={selectedDocType}
                    onValueChange={(value) =>
                      setSelectedDocType(value as DocumentType)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
                  Add document
                </Button>
              </div>

              <label
                onClick={(e) => {
                  if (!selectedDocType) {
                    e.preventDefault();
                    toast({
                      variant: 'destructive',
                      title: 'Select a document type first',
                    });
                  }
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                  selectedDocType
                    ? 'border-slate-300 hover:border-green-500 hover:bg-green-50/40'
                    : 'border-slate-200 opacity-70'
                }`}
              >
                <UploadCloud className="h-6 w-6 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">
                  Click to upload
                </span>
                <span className="text-xs text-slate-400">
                  {selectedDocType
                    ? `Adding as: ${DOC_TYPE_LABELS[selectedDocType]}`
                    : 'Choose a document type above to begin'}
                </span>
                <input
                  ref={documentInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={!selectedDocType}
                  onChange={(e) => handleDocumentFile(e.target.files?.[0])}
                />
              </label>

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
                          {DOC_TYPE_LABELS[doc.type] || doc.type} ·{' '}
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

          {/* Footer nav */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
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
              <Link
                href="/login"
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Already registered? Sign in
              </Link>
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
                {isSubmitting ? 'Submitting…' : 'Submit application'}
              </Button>
            )}
          </div>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        By submitting you agree to RUTE&apos;s{' '}
        <Link href="/terms-and-conditions" className="underline">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy-policy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
};

export default RegisterWorkerPage;
