'use client';

import { useState, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCategory } from '@/lib/client/api';
import { uploadCategoryImage } from '@/lib/client/utils/uploadImage';
import { categoryFormSchema, CategoryFormValues } from '@/lib/validations';

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
    watch,
    setValue,
    formState: { errors: formErrors, isDirty },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      image_url: '',
      charge_type: 'hourly',
      service_fee: 0,
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
        charge_type: data.charge_type,
        service_fee: data.service_fee,
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
      <div className="bg-card md:border md:rounded-lg md:p-6">
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

          {/* Category Charge Type */}
          <div>
            <Label htmlFor="charge_type">Charge Type</Label>
            <Select
              value={watch('charge_type') || 'hourly'}
              onValueChange={(value) => {
                setValue('charge_type', value as 'hourly' | 'day', {
                  shouldValidate: true,
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

          <div>
            <Label htmlFor="service_fee">Service Fee (ZAR) *</Label>
            <Input
              id="service_fee"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('service_fee', { valueAsNumber: true })}
              className="mt-2"
              disabled={isSubmitting}
            />
            {formErrors.service_fee && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.service_fee.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Enter the fixed service fee for this category.
            </p>
          </div>

          {/* Category Image */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
            <Label htmlFor="image">Category Image</Label>
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
                disabled={isSubmitting}
                className="flex-1"
              >
                {selectedFile ? 'Change Image' : 'Choose Image'}
              </Button>
              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isSubmitting}
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
              id="image"
            />
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
