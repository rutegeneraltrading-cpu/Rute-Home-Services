'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PhoneInput from 'react-phone-input-2';
import { Camera } from 'lucide-react';
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
import { uploadWorkerAvatarImage } from '@/lib/client/utils/uploadImage';

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

  // Use imported workerFormSchema for validation

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    getValues,
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
      // Only validate step 1 fields
      const valid = await trigger(
        ['full_name', 'email', 'phone', 'whatsappConsent', 'service_ids'],
        { shouldFocus: true },
      );
      if (valid) {
        setStep(2);
      }
    } else if (step === 2) {
      // Only validate step 2 fields
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
      if (valid) {
        setStep(3);
      }
    }
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Helper to upload a document to backend API and get public URL
  const uploadDocument = async (file: File, type: DocumentType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await fetch('/api/admin/upload-worker-document', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to upload document');
    }
    const { url } = await res.json();
    return { type, file_url: url };
  };

  const onSubmit = async (data: WorkerFormValues) => {
    setIsSubmitting(true);
    try {
      // 0. Upload profile image if provided
      let avatarUrl: string | undefined;
      if (profileImage) {
        try {
          avatarUrl = await uploadWorkerAvatarImage(profileImage);
        } catch {
          toast({
            title: 'Image Upload Failed',
            description: 'Could not upload profile image.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }

      // 1. Upload all documents to backend and get URLs
      const uploadedDocs: Array<{ type: string; file_url: string }> = [];
      for (const doc of documents) {
        try {
          uploadedDocs.push(await uploadDocument(doc.file, doc.type));
        } catch {
          toast({
            title: 'Document Upload Failed',
            description: 'Could not upload document.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Submit all data to backend
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
      reset();
      setSelectedServiceIds([]);
      setDocuments([]);
      setProfileImage(null);
      setProfileImagePreview(null);
      router.push('/');
    } catch (error) {
      console.error('Error creating worker:', error);
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Failed to create worker.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-10 flex justify-center">
      <div className="sm:w-150 bg-card md:border md:rounded-lg md:p-8">
        <div className="mb-6 sm:text-start text-center">
          <h1 className="text-2xl font-bold">Worker Account</h1>
          <p className="text-sm text-muted-foreground">
            Create your worker account in 3 easy steps.
          </p>
        </div>

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Base Info */}
          {step === 1 && (
            <div className="rounded-lg border border-dashed border-gray-200 p-4">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center gap-2 mb-5">
                <div
                  className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => profileImageRef.current?.click()}
                >
                  {profileImagePreview ? (
                    <Image
                      src={profileImagePreview}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      <Camera className="w-6 h-6" />
                      <span className="text-xs">Add Photo</span>
                    </div>
                  )}
                </div>
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
                        title: 'Invalid File',
                        description: 'Please select an image file.',
                      });
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      toast({
                        variant: 'destructive',
                        title: 'File Too Large',
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
                <p className="text-xs text-muted-foreground">Profile Photo *</p>
                {profileImageError && (
                  <p className="text-xs text-red-500">
                    Please upload a profile photo.
                  </p>
                )}
                <p className="text-xs text-amber-600 text-center">
                  ⚠️ Your photo is very important. <br /> Kindly use a real,
                  clear face photo.
                </p>
                {profileImagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage(null);
                      setProfileImagePreview(null);
                    }}
                    className="text-xs text-red-500 underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
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
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.full_name.message}
                    </p>
                  )}

                  <Label htmlFor="email">Email *</Label>
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
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <PhoneInput
                    country={'za'}
                    inputProps={{
                      name: 'phone',
                      required: true,
                      className:
                        'h-10 w-full border rounded-md shadow-xs px-2 pl-12',
                    }}
                    value={getValues('phone')}
                    onChange={(value) =>
                      setValue('phone', value, { shouldDirty: true })
                    }
                    enableSearch
                    containerClass="mb-2"
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.phone.message}
                    </p>
                  )}
                  <label className="flex items-start gap-2 text-xs text-muted-foreground mb-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0"
                      checked={watch('whatsappConsent') || false}
                      onChange={(e) => {
                        setValue('whatsappConsent', e.target.checked, {
                          shouldDirty: true,
                        });
                        trigger('whatsappConsent');
                      }}
                    />
                    <span>
                      Yes, sign me up to receive WhatsApp messages from Rute
                      Home Services about job assignments and booking
                      updates. Message frequency varies. Message and data
                      rates may apply. Reply STOP to opt out or HELP for
                      help. See our{' '}
                      <Link href="/terms-and-conditions" className="underline">
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy-policy" className="underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                  {formErrors.whatsappConsent && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.whatsappConsent.message}
                    </p>
                  )}
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
                    disabled={servicesLoading || isSubmitting}
                  />
                  {formErrors.service_ids && (
                    <div className="text-xs text-red-500 mt-1">
                      {formErrors.service_ids.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address Info */}
          {step === 2 && (
            <div className="rounded-lg border border-dashed border-gray-200 p-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label className="text-sm">Label</Label>
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
                    <SelectTrigger className="h-10">
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
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.address.recipient_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="address.phone">Address Phone *</Label>
                  <PhoneInput
                    country={'za'}
                    inputProps={{
                      name: 'address.phone',
                      required: true,
                      className: 'h-10 w-full border rounded px-2 pl-12',
                    }}
                    value={getValues('address.phone')}
                    onChange={(value) => {
                      setValue('address.phone', value, { shouldDirty: true });
                      if (!value) {
                        setValue('address.phone', value, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    enableSearch
                    containerClass="mb-2"
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
                  <Label htmlFor="address.country">Country *</Label>
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
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.address.country.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="address.state_province">
                    Province/State *
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
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.address.state_province.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="address.city">City *</Label>
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
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.address.city.message}
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
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.address.postal_code.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Document Upload */}
          {step === 3 && (
            <div className="rounded-lg border border-dashed border-gray-200 p-4">
              <div className="grid grid-cols-1 gap-6 w-full">
                <div>
                  <Label>Select Document Type</Label>
                  <Select
                    value={selectedDocType}
                    onValueChange={(value) =>
                      setSelectedDocType(value as DocumentType)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DocumentType.Identity}>
                        Identity
                      </SelectItem>
                      <SelectItem value={DocumentType.Passport}>
                        Passport
                      </SelectItem>
                      <SelectItem value={DocumentType.ProofOfResidency}>
                        Proof of Residency
                      </SelectItem>
                      <SelectItem value={DocumentType.BusinessRegistration}>
                        Business Registration
                      </SelectItem>
                      <SelectItem value={DocumentType.BankConfirmation}>
                        Bank Confirmation
                      </SelectItem>
                      <SelectItem value={DocumentType.ShareholderId}>
                        Shareholder ID
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className={`${documents.length > 0 ? 'hidden' : ''}`}>
                  <Label>Upload Document</Label>
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple={false}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files[0] && selectedDocType) {
                        setDocuments((prev) => [
                          ...prev,
                          {
                            file: files[0],
                            type: selectedDocType as DocumentType,
                          },
                        ]);
                        // Do NOT reset selectedDocType here
                      }
                    }}
                    className="mb-4"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Select document type before uploading.
                  </p>
                </div>
              </div>
              {/* Preview selected files with type label */}
              <div className="flex flex-wrap gap-4 mt-4">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center border rounded p-2"
                  >
                    {doc.file.type.startsWith('image/') ? (
                      <Image
                        src={URL.createObjectURL(doc.file)}
                        alt={doc.file.name}
                        width={400}
                        height={400}
                        className="w-full object-cover rounded"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">PDF</span>
                    )}
                    <button
                      type="button"
                      className="mt-2 text-xs text-red-500 underline"
                      onClick={() => {
                        setDocuments((prev) =>
                          prev.filter((_, i) => i !== idx),
                        );
                        // Do NOT reset selectedDocType here
                      }}
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  documents.length === 0 ||
                  documents.some((doc) => !doc.type || !doc.file)
                }
              >
                {isSubmitting ? 'Creating...' : 'Create Worker'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterWorkerPage;
