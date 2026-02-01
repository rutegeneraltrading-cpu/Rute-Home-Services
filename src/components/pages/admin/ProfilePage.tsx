'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useGetProfile, useUpdateProfile } from '@/lib/client/api';
import {
  uploadProfileImage,
  deleteProfileImage,
} from '@/lib/client/utils/uploadImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import LoadingPage from '@/app/loading';

const ProfilePage = () => {
  const { data: profile, isLoading, error } = useGetProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when profile data arrives
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
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

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setIsUploadingImage(true);

    try {
      const imageUrl = await uploadProfileImage(selectedFile);

      // If there was an old avatar, delete it
      if (profile?.avatar_url) {
        try {
          await deleteProfileImage(profile.avatar_url);
        } catch (error) {
          console.error('Failed to delete old image:', error);
        }
      }

      // Update profile with new image URL
      updateProfile({ avatar_url: imageUrl });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload image';
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

  if (isLoading) return <LoadingPage />;

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Admin Profile</h1>

        {/* Profile Avatar Section */}
        <div className="mb-6">
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture
          </Label>

          <div className="flex flex-col items-center gap-4">
            {/* Current or Preview Image */}
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

            {/* File Input */}
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
                className="w-full cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Image
              </Button>
            </div>

            {/* Upload Button - Only show if file selected */}
            {selectedFile && (
              <Button
                type="button"
                onClick={handleUploadImage}
                disabled={isUploadingImage}
                className="w-full bg-black hover:bg-black/80 text-white cursor-pointer"
              >
                {isUploadingImage ? 'Uploading...' : 'Upload Image'}
              </Button>
            )}
          </div>
        </div>

        {/* Full Name Section */}
        <div className="mb-6">
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
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter full name"
          />
        </div>

        {/* Email (Read-only) */}
        <div className="mb-6">
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </Label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700">
            {profile.email}
          </div>
        </div>

        {/* Role & Status (Read-only) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </Label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm">
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </Label>
            <div
              className={`px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                profile.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : profile.status === 'suspended'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSaveProfile}
          disabled={isPending || fullName === profile.full_name}
          className="w-full bg-black hover:bg-black/80 text-white cursor-pointer"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;
