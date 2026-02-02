'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCategory } from '@/lib/client/api';
import { uploadCategoryImage } from '@/lib/client/utils/uploadImage';
import { toast } from 'sonner';

const categoryFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  display_order: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function ServiceCategoryForm() {
  const createCategoryMutation = useCreateCategory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors, isDirty },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      image_url: '',
      display_order: '0',
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
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

  const onSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined = undefined;

      // Step 1: Upload image first if selected
      if (selectedFile) {
        toast.info('Uploading image...');
        imageUrl = await uploadCategoryImage(selectedFile);
        toast.success('Image uploaded successfully');
      }

      // Step 2: Create category with image URL
      await createCategoryMutation.mutateAsync({
        name: data.name,
        description: data.description,
        image_url: imageUrl,
        display_order: data.display_order ? parseInt(data.display_order) : 0,
      });

      // Clear form after success
      reset();
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create category',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-card border rounded-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Name */}
          <div>
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              placeholder="e.g., House Cleaning, AC Repair, Plumbing"
              {...register('name')}
              className="mt-2"
            />
            {formErrors.name && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Describe this service category..."
              {...register('description')}
              className="mt-2 w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
            {formErrors.description && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.description.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Optional - describe what services are included
            </p>
          </div>

          {/* Category Image */}
          <div>
            <Label>Category Image</Label>

            <div className="mt-2 space-y-4">
              {/* Preview Image */}
              {previewUrl && (
                <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-gray-300">
                  <Image
                    src={previewUrl}
                    alt="Category preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* File Input Button */}
              <div>
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
                  disabled={isSubmitting}
                >
                  {selectedFile ? 'Change Image' : 'Choose Image (Optional)'}
                </Button>
              </div>

              {selectedFile && (
                <p className="text-xs text-blue-600 font-medium">
                  ✓ Image selected - will upload when you create category
                </p>
              )}
            </div>
          </div>

          {/* Display Order */}
          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              placeholder="0"
              {...register('display_order')}
              className="mt-2"
            />
            {formErrors.display_order && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.display_order.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Optional - controls the order categories appear (lower numbers
              first)
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
