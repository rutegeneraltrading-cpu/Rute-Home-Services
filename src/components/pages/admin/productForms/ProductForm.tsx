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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
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
      slug: '',
      description: '',
      price: '',
      sale_price: '',
      brand: '',
      sku: '',
      attributes: '',
      category_id: '',
      stock: '',
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image must be less than 5MB');
        return;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    });

    if (!validFiles.length) return;

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...previews]);
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      let imageUrls: string[] = [];

      // Upload images first if selected
      if (selectedFiles.length > 0) {
        setIsUploadingImage(true);
        toast.loading('Uploading images...');
        imageUrls = await Promise.all(
          selectedFiles.map((file) => uploadProductImage(file)),
        );
        toast.dismiss();
      }

      const attributesValue = data.attributes
        ? JSON.parse(data.attributes)
        : undefined;
      const salePriceValue = data.sale_price
        ? parseFloat(data.sale_price)
        : undefined;

      await createProductMutation.mutateAsync({
        name: data.name,
        slug: data.slug || undefined,
        description: data.description || undefined,
        price: parseFloat(data.price),
        sale_price: salePriceValue,
        brand: data.brand || undefined,
        sku: data.sku || undefined,
        attributes: attributesValue,
        category_id: data.category_id,
        stock: parseInt(data.stock),
        images: imageUrls,
      });

      toast.success('Product created successfully');
      reset();
      setSelectedFiles([]);
      setPreviewUrls([]);
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
    <div className="bg-card md:border md:rounded-lg md:p-6">
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="slug">Slug (SEO)</Label>
            <Input
              id="slug"
              placeholder="e.g., premium-cleaning-kit"
              {...register('slug')}
              className="mt-2"
            />
            {formErrors.slug && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.slug.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              placeholder="e.g., Rute Essentials"
              {...register('brand')}
              className="mt-2"
            />
            {formErrors.brand && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.brand.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              placeholder="e.g., RUTE-CK-001"
              {...register('sku')}
              className="mt-2"
            />
            {formErrors.sku && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.sku.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="sale_price">Sale Price (R)</Label>
            <Input
              id="sale_price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('sale_price')}
              className="mt-2"
            />
            {formErrors.sale_price && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.sale_price.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="attributes">Attributes (JSON)</Label>
          <textarea
            id="attributes"
            placeholder='{"color":"green","size":"medium"}'
            {...register('attributes')}
            className="mt-2 w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          {formErrors.attributes && (
            <p className="text-sm text-red-500 mt-1">
              {formErrors.attributes.message}
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        </div>

        {/* Product Images */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
          <Label htmlFor="image">Product Images</Label>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Upload one or more images (first image becomes primary)
          </p>

          {previewUrls.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {previewUrls.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="relative h-90 w-full overflow-hidden rounded-md border"
                >
                  <Image
                    src={url}
                    alt={`Product preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrls((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                      setSelectedFiles((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                      if (fileInputRef.current && previewUrls.length === 1) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-1 right-1 rounded-full bg-white/90 text-xs px-2 py-0.5 shadow"
                  >
                    Remove
                  </button>
                </div>
              ))}
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
              {previewUrls.length ? 'Add More Images' : 'Choose Images'}
            </Button>
            {previewUrls.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPreviewUrls([]);
                  setSelectedFiles([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={isSubmitting || isUploadingImage}
              >
                Clear All
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
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
                setSelectedFiles([]);
                setPreviewUrls([]);
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
