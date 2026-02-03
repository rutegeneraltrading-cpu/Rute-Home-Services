'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadCategoryImage } from '@/lib/client/utils/uploadImage';
import { toast } from 'sonner';
import { categoryKeys } from '@/lib/client/api/services/categories.query';

const categoryEditSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  display_order: z.string().optional(),
});

type CategoryEditValues = z.infer<typeof categoryEditSchema>;

interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  display_order?: number | null;
}

interface ServiceCategoryEditModalProps {
  open: boolean;
  category: ServiceCategory | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ServiceCategoryEditModal({
  open,
  category,
  onOpenChange,
  onSuccess,
}: ServiceCategoryEditModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageDirty, setIsImageDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultValues = useMemo(
    () => ({
      name: category?.name || '',
      description: category?.description || '',
      display_order:
        category?.display_order !== null &&
        category?.display_order !== undefined
          ? String(category.display_order)
          : '0',
    }),
    [category],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors, isDirty },
  } = useForm<CategoryEditValues>({
    resolver: zodResolver(categoryEditSchema),
    defaultValues,
  });

  useEffect(() => {
    if (category) {
      reset(defaultValues);
      setSelectedFile(null);
      setPreviewUrl(category.image_url || '');
      setIsImageDirty(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [category, reset, defaultValues]);

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

  const onSubmit = async (data: CategoryEditValues) => {
    if (!category) return;
    setIsSubmitting(true);

    try {
      let imageUrl = category.image_url || undefined;

      if (selectedFile) {
        setIsUploadingImage(true);
        toast.loading('Uploading image...');
        imageUrl = await uploadCategoryImage(selectedFile);
        toast.dismiss();
      }

      const response = await fetch(
        `/api/admin/services/categories/${category.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            description: data.description || null,
            image_url: imageUrl || null,
            display_order: data.display_order
              ? parseInt(data.display_order)
              : 0,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update category');
      }

      await queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success('Category updated successfully');
      setIsImageDirty(false);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update category';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  if (!category) return null;
  const canSubmit = isDirty || isImageDirty;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <Label htmlFor="category-display-order">Display Order</Label>
            <Input
              id="category-display-order"
              type="number"
              {...register('display_order')}
              className="mt-2"
            />
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
                disabled={isSubmitting || isUploadingImage}
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
                  disabled={isSubmitting || isUploadingImage}
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploadingImage || !canSubmit}
            >
              {isSubmitting ? 'Updating...' : 'Update Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
