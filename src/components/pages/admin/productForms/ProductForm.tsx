'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';
import { uploadProductImage } from '@/lib/client/utils/uploadImage';
import { productFormSchema, ProductFormValues } from '@/lib/validations';
import { useCreateProduct, useGetProductCategories } from '@/lib/client/api';

interface ProductFormProps {
  onSuccess?: () => void;
}

export function ProductForm({ onSuccess }: ProductFormProps) {
  const createProductMutation = useCreateProduct();
  const { data: categories = [] } = useGetProductCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors: formErrors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      category_id: '',
      stock: '',
      image_url: '',
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined = undefined;

      // Upload image first if selected
      if (selectedFile) {
        setIsUploadingImage(true);
        toast.loading('Uploading image...');
        imageUrl = await uploadProductImage(selectedFile);
        toast.dismiss();
      }

      await createProductMutation.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        price: parseFloat(data.price),
        category_id: data.category_id,
        stock: parseInt(data.stock),
        image_url: imageUrl,
      });

      toast.success('Product created successfully');
      reset();
      setSelectedFile(null);
      setPreviewUrl('');
      setSelectedCategoryId('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create product';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Name */}
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Cleaning Kit, Vacuum Cleaner"
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
            placeholder="Describe the product..."
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

        {/* Category */}
        <div>
          <Label htmlFor="category_id">Category *</Label>
          <Select
            value={selectedCategoryId}
            onValueChange={(value) => {
              setSelectedCategoryId(value);
              setValue('category_id', value, { shouldValidate: true });
            }}
            disabled={isSubmitting || isUploadingImage}
          >
            <SelectTrigger id="category_id" className="mt-2">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories && categories.length > 0 ? (
                categories.map((cat: { id: string; name: string }) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem disabled value="none">
                  No categories available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {formErrors.category_id && (
            <p className="text-sm text-red-500 mt-1">
              {formErrors.category_id.message}
            </p>
          )}
        </div>

        {/* Price */}
        <div>
          <Label htmlFor="price">Price (R) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('price')}
            className="mt-2"
          />
          {formErrors.price && (
            <p className="text-sm text-red-500 mt-1">
              {formErrors.price.message}
            </p>
          )}
        </div>

        {/* Stock */}
        <div>
          <Label htmlFor="stock">Stock Quantity *</Label>
          <Input
            id="stock"
            type="number"
            placeholder="0"
            {...register('stock')}
            className="mt-2"
          />
          {formErrors.stock && (
            <p className="text-sm text-red-500 mt-1">
              {formErrors.stock.message}
            </p>
          )}
        </div>

        {/* Product Image */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
          <Label htmlFor="image">Product Image</Label>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Upload an image for your product
          </p>

          {previewUrl && (
            <div className="mb-4 relative w-full h-48 rounded-md overflow-hidden">
              <Image
                src={previewUrl}
                alt="Product preview"
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
            id="image"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSelectedFile(null);
                setPreviewUrl('');
                setSelectedCategoryId('');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty || isUploadingImage}
          >
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
