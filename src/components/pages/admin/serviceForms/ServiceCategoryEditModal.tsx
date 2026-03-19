'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUpdateServiceCategory } from '@/lib/client/api';
import { uploadCategoryImage } from '@/lib/client/utils/uploadImage';
import {
  categoryEditServiceSchema,
  CategoryEditServiceValues,
} from '@/lib/validations';
import { ServiceCategoryEditModalProps } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

export function ServiceCategoryEditModal({
  open,
  category,
  onOpenChange,
  onSuccess,
}: ServiceCategoryEditModalProps) {
  const updateCategoryMutation = useUpdateServiceCategory(category?.id || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageDirty, setIsImageDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultValues = useMemo(
    () => ({
      name: category?.name || '',
      description: category?.description || '',
      image_url: category?.image_url || '',
      charge_type: category?.charge_type || 'hourly',
    }),
    [category],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors: formErrors, isDirty, isSubmitting, dirtyFields },
  } = useForm<CategoryEditServiceValues>({
    resolver: zodResolver(categoryEditServiceSchema),
    defaultValues,
  });

  useEffect(() => {
    if (category) {
      reset(defaultValues);
    }
  }, [category, reset, defaultValues]);

  useEffect(() => {
    if (category) {
      setSelectedFile(null);
      setPreviewUrl(category.image_url || '');
      setIsImageDirty(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [category]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setIsImageDirty(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: CategoryEditServiceValues) => {
    if (!category) return;

    let imageUrl = category.image_url || undefined;

    if (selectedFile) {
      setIsUploadingImage(true);
      toast.loading('Uploading image...');
      try {
        imageUrl = await uploadCategoryImage(selectedFile);
        toast.dismiss();
      } catch {
        toast.dismiss();
        toast.error('Failed to upload image');
        setIsUploadingImage(false);
        return;
      }
      setIsUploadingImage(false);
    }

    updateCategoryMutation.mutate(
      {
        name: data.name,
        description: data.description || undefined,
        image_url: imageUrl || undefined,
        charge_type: data.charge_type,
      },
      {
        onSuccess: () => {
          setIsImageDirty(false);
          onSuccess?.();
          onOpenChange(false);
        },
      },
    );
  };

  if (!category) return null;
  const canSubmit = isDirty || isImageDirty || dirtyFields.charge_type;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the selected service category details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="category-name">Category Name *</Label>
            <Input id="category-name" {...register('name')} className="mt-2" />
            {formErrors.name && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="category-description">Description</Label>
            <textarea
              id="category-description"
              {...register('description')}
              className="mt-2 w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
            {formErrors.description && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="charge_type">Charge Type</Label>
            <Select
              value={watch('charge_type') || 'hourly'}
              onValueChange={(value) => {
                setValue('charge_type', value as 'hourly' | 'day', {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger id="charge_type" className="mt-2">
                <SelectValue placeholder="Select charge type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.charge_type && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.charge_type.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Select how this category is charged (per hour or per day)
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
            <Label htmlFor="category-image">Category Image</Label>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Upload an image for your category
            </p>

            {previewUrl && (
              <div className="mb-4 relative w-full h-48 rounded-md overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Category preview"
                  width={400}
                  height={400}
                  className="w-48 rounded-lg"
                  priority
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={updateCategoryMutation.isPending || isUploadingImage}
                className="flex-1"
              >
                {previewUrl ? 'Change Image' : 'Choose Image'}
              </Button>
              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPreviewUrl('');
                    setSelectedFile(null);
                    setIsImageDirty(true);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={
                    updateCategoryMutation.isPending || isUploadingImage
                  }
                >
                  Remove
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="category-image"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                updateCategoryMutation.isPending ||
                isUploadingImage ||
                !canSubmit
              }
            >
              {updateCategoryMutation.isPending
                ? 'Updating...'
                : 'Update Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
