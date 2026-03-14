'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import PhoneInput from 'react-phone-input-2';
import {
  useCreateUserAddress,
  useDeleteUserAddress,
  useGetProfile,
  useGetUserAddresses,
  useUpdateProfile,
  useUpdateUserAddress,
} from '@/lib/client/api';
import {
  uploadProfileImage,
  deleteProfileImage,
} from '@/lib/client/utils/uploadImage';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { toast } from '@/components/ui/use-toast';
import { ActionDropdown } from '@/components/common/ActionDropdown';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { Loading } from '@/components/common';
import { userAddressSchema } from '@/lib/validations';
import { UserAddress, UserAddressFormValues } from '@/lib/types';

const buildDefaultAddressForm = (
  fullName: string,
  shouldBePrimary: boolean,
): UserAddressFormValues => ({
  label: 'home',
  recipient_name: fullName,
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state_province: '',
  postal_code: '',
  country: 'ZA',
  is_primary: shouldBePrimary,
});

const ProfilePage = () => {
  const { data: profile, isLoading, error } = useGetProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { data: addressesData, isLoading: isAddressesLoading } =
    useGetUserAddresses();
  const { mutateAsync: createAddress, isPending: isCreatingAddress } =
    useCreateUserAddress();
  const { mutateAsync: updateAddress, isPending: isUpdatingAddress } =
    useUpdateUserAddress();
  const { mutateAsync: deleteAddress, isPending: isDeletingAddress } =
    useDeleteUserAddress();

  const addresses = addressesData?.addresses || [];

  const [fullName, setFullName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [avatarEditOpen, setAvatarEditOpen] = useState(false);

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [activeAddress, setActiveAddress] = useState<UserAddress | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    reset: resetAddressForm,
    control: addressControl,
    setValue: setAddressValue,
    watch: watchAddress,
    formState: { errors: addressErrors },
  } = useForm<UserAddressFormValues>({
    resolver: zodResolver(userAddressSchema),
    defaultValues: buildDefaultAddressForm('', true),
  });

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please select a valid image file',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'File size must be less than 5MB',
      });
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setIsUploadingImage(true);

    try {
      const imageUrl = await uploadProfileImage(selectedFile);

      if (profile?.avatar_url) {
        try {
          await deleteProfileImage(profile.avatar_url);
        } catch (deleteError) {
          console.error('Failed to delete old image:', deleteError);
        }
      }

      updateProfile({ avatar_url: imageUrl });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (uploadError) {
      const errorMessage =
        uploadError instanceof Error
          ? uploadError.message
          : 'Failed to upload image';
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: errorMessage,
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = () => {
    if (!fullName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Full name cannot be empty',
      });
      return;
    }

    updateProfile({ full_name: fullName });
  };

  const openAddAddress = () => {
    const shouldBePrimary = addresses.length === 0;
    resetAddressForm(
      buildDefaultAddressForm(profile?.full_name || '', shouldBePrimary),
    );
    setIsEditingAddress(false);
    setActiveAddress(null);
    setAddressModalOpen(true);
  };

  const openEditAddress = (address: UserAddress) => {
    resetAddressForm({
      label: address.label,
      recipient_name: address.recipient_name || '',
      phone: address.phone || '',
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state_province: address.state_province,
      postal_code: address.postal_code,
      country: address.country,
      is_primary: address.is_primary,
    });
    setIsEditingAddress(true);
    setActiveAddress(address);
    setAddressModalOpen(true);
  };

  const openDeleteAddress = (address: UserAddress) => {
    setActiveAddress(address);
    setDeleteDialogOpen(true);
  };

  const onAddressSubmit = async (data: UserAddressFormValues) => {
    const payload = {
      label: data.label,
      recipient_name: data.recipient_name?.trim() || null,
      phone: data.phone?.trim() || null,
      line1: data.line1.trim(),
      line2: data.line2?.trim() || null,
      city: data.city.trim(),
      state_province: data.state_province.trim(),
      postal_code: data.postal_code.trim(),
      country: data.country.trim(),
      is_primary: Boolean(data.is_primary),
    };

    if (isEditingAddress && activeAddress) {
      await updateAddress({ id: activeAddress.id, data: payload });
    } else {
      await createAddress(payload);
    }

    setAddressModalOpen(false);
    setActiveAddress(null);
  };

  const handleDeleteAddress = async () => {
    if (!activeAddress) return;
    await deleteAddress(activeAddress.id);
    setDeleteDialogOpen(false);
    setActiveAddress(null);
  };

  if (isLoading) return <Loading />;

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="py-10 md:px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white md:rounded-lg md:shadow-md md:p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
              <p className="text-sm text-gray-500">
                Manage your account details and profile picture.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAvatarEditOpen(true)}
              >
                Update Photo
              </Button>
              <Button type="button" onClick={() => setProfileEditOpen(true)}>
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <Image
                    src={profile?.avatar_url}
                    alt={profile.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-3xl">
                    {profile.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">Profile Photo</span>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </Label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {profile.full_name}
                </div>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </Label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {profile.email}
                </div>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (Primary Address)
                </Label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {profile.phone || '—'}
                </div>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile
                </Label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 capitalize">
                  {profile.status}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white md:rounded-lg md:shadow-md md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Address Book
              </h2>
              <p className="text-sm text-gray-500">
                Manage your delivery and service addresses.
              </p>
            </div>
            <Button type="button" onClick={openAddAddress}>
              Add Address
            </Button>
          </div>

          {isAddressesLoading ? (
            <Loading />
          ) : addresses.length === 0 ? (
            <div className="text-sm text-gray-500">No addresses added yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="relative rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">
                      {address.label.charAt(0).toUpperCase() +
                        address.label.slice(1)}
                    </Badge>
                    {address.is_primary && <Badge>Primary</Badge>}
                  </div>

                  <div className="space-y-1 text-sm text-gray-700">
                    <p className="font-medium">
                      {address.recipient_name || profile.full_name}
                    </p>
                    <p>{address.line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>
                      {address.city}, {address.state_province}{' '}
                      {address.postal_code}
                    </p>
                    <p>{address.country}</p>
                    {address.phone && (
                      <p className="text-gray-500">{address.phone}</p>
                    )}
                  </div>

                  <ActionDropdown
                    onEdit={() => openEditAddress(address)}
                    onDelete={() => openDeleteAddress(address)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditingAddress ? 'Update Address' : 'Add Address'}
            </DialogTitle>
            <DialogDescription>
              Provide a complete address so we can deliver your services faster.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddressSubmit(onAddressSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Label
                </Label>
                <Select
                  value={watchAddress('label')}
                  onValueChange={(value) =>
                    setAddressValue(
                      'label',
                      value as UserAddressFormValues['label'],
                      { shouldValidate: true },
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
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name
                </Label>
                <Input
                  {...registerAddress('recipient_name')}
                  placeholder="Recipient name"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </Label>
                <Controller
                  name="phone"
                  control={addressControl}
                  render={({ field }) => (
                    <PhoneInput
                      country={'za'}
                      inputProps={{
                        name: field.name,
                        className:
                          'h-9 w-full border rounded-md shadow-xs px-2 pl-12',
                      }}
                      value={field.value || ''}
                      onChange={(value) => field.onChange(value)}
                      onBlur={field.onBlur}
                      placeholder="+27 81 234 5678"
                      enableSearch
                      containerClass="mb-2"
                    />
                  )}
                />
                {addressErrors.phone && (
                  <p className="text-sm text-red-500 mt-1">
                    {addressErrors.phone.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1
                </Label>
                <Input
                  {...registerAddress('line1')}
                  placeholder="Street address"
                />
                {addressErrors.line1 && (
                  <p className="text-sm text-red-500 mt-1">
                    {addressErrors.line1.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2
                </Label>
                <Input
                  {...registerAddress('line2')}
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </Label>
                <Input {...registerAddress('city')} placeholder="City" />
                {addressErrors.city && (
                  <p className="text-sm text-red-500 mt-1">
                    {addressErrors.city.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Province/State
                </Label>
                <Input
                  {...registerAddress('state_province')}
                  placeholder="Province or state"
                />
                {addressErrors.state_province && (
                  <p className="text-sm text-red-500 mt-1">
                    {addressErrors.state_province.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  {...registerAddress('postal_code')}
                  placeholder="Postal code"
                />
                {addressErrors.postal_code && (
                  <p className="text-sm text-red-500 mt-1">
                    {addressErrors.postal_code.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </Label>
                <Input {...registerAddress('country')} placeholder="Country" />
                {addressErrors.country && (
                  <p className="text-sm text-red-500 mt-1">
                    {addressErrors.country.message as string}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-6">
                <input
                  id="primary-address"
                  type="checkbox"
                  {...registerAddress('is_primary')}
                  className="h-4 w-4"
                />
                <Label htmlFor="primary-address">Set as primary address</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddressModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingAddress || isUpdatingAddress}
              >
                {isEditingAddress
                  ? isUpdatingAddress
                    ? 'Updating...'
                    : 'Update Address'
                  : isCreatingAddress
                    ? 'Saving...'
                    : 'Save Address'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={avatarEditOpen}
        onOpenChange={(open) => {
          setAvatarEditOpen(open);
          if (!open) {
            setSelectedFile(null);
            setPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription>Upload a new profile picture.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : profile?.avatar_url ? (
                <Image
                  src={profile?.avatar_url}
                  alt={profile.full_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-gray-400 text-4xl">
                  {profile.full_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Image
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleUploadImage}
              disabled={isUploadingImage || !selectedFile}
              className="w-full bg-black hover:bg-black/80 text-white"
            >
              {isUploadingImage ? 'Uploading...' : 'Save Photo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={profileEditOpen} onOpenChange={setProfileEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
            <DialogDescription>Edit your basic information.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </Label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700">
                {profile.email}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSaveProfile}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Address"
        itemName={activeAddress?.label}
        description="Are you sure you want to delete this address?"
        onConfirm={handleDeleteAddress}
        isDeleting={isDeletingAddress}
      />
    </div>
  );
};

export default ProfilePage;
