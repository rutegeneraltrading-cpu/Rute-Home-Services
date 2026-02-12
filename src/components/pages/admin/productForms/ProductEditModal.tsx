'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product } from '@/lib/types';
import { uploadProductImage } from '@/lib/client/utils/uploadImage';
import { productEditSchema, ProductEditValues } from '@/lib/validations';
import { useGetProductCategories, useUpdateProduct } from '@/lib/client/api';

interface ProductEditModalProps {
  open: boolean;
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProductEditModal({
  open,
  product,
  onOpenChange,
  onSuccess,
}: ProductEditModalProps) {
  const updateProductMutation = useUpdateProduct(product?.id || '');
  const { data: categories = [] } = useGetProductCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageDirty, setIsImageDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultValues = useMemo(
    () => ({
      name: product?.name || '',
      slug: product?.slug || '',
      description: product?.description || '',
      price: product?.price ? String(product.price) : '',
      sale_price: product?.sale_price ? String(product.sale_price) : '',
      brand: product?.brand || '',
      sku: product?.sku || '',
      attributes: product?.attributes
        ? JSON.stringify(product.attributes, null, 2)
        : '',
      category_id: product?.category_id || '',
      stock: product?.stock ? String(product.stock) : '',
    }),
    [product],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors: formErrors, isDirty },
  } = useForm<ProductEditValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues,
  });

  useEffect(() => {
    if (product) {
      reset(defaultValues);
      setSelectedCategoryId(product.category_id || '');
      const currentImages = product.images
        ? product.images.map((image) => image.url)
        : [];
      setExistingImages(currentImages);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setIsImageDirty(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [product, reset, defaultValues]);

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
    setIsImageDirty(true);
  };

  const onSubmit = async (data: ProductEditValues) => {
    if (!product) return;
    setIsSubmitting(true);
    try {
      let uploadedUrls: string[] = [];

      if (selectedFiles.length > 0) {
        setIsUploadingImage(true);
        toast.loading('Uploading images...');
        uploadedUrls = await Promise.all(
          selectedFiles.map((file) => uploadProductImage(file)),
        );
        toast.dismiss();
      }

      const attributesValue = data.attributes
        ? JSON.parse(data.attributes)
        : undefined;

      const imagesPayload = [...existingImages, ...uploadedUrls];

      await updateProductMutation.mutateAsync({
        name: data.name,
        slug: data.slug || undefined,
        description: data.description || undefined,
        price: parseFloat(data.price),
        sale_price: data.sale_price ? parseFloat(data.sale_price) : null,
        brand: data.brand || null,
        sku: data.sku || null,
        attributes: attributesValue,
        category_id: data.category_id,
        stock: parseInt(data.stock, 10),
        images: imagesPayload,
      });

      toast.success('Product updated successfully');
      setIsImageDirty(false);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update product';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  if (!product) return null;
  const canSubmit = isDirty || isImageDirty;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the selected product details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" {...register('name')} className="mt-2" />
            {formErrors.name && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="slug">Slug (SEO)</Label>
              <Input id="slug" {...register('slug')} className="mt-2" />
              {formErrors.slug && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.slug.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" {...register('brand')} className="mt-2" />
              {formErrors.brand && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.brand.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register('sku')} className="mt-2" />
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

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
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
            <div>
              <Label htmlFor="price">Price (R) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price')}
                className="mt-2"
              />
              {formErrors.price && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.price.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
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

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
            <Label htmlFor="image">Product Images</Label>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Upload one or more images (first image becomes primary)
            </p>

            {[...existingImages, ...previewUrls].length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[...existingImages, ...previewUrls].map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="relative h-24 w-full overflow-hidden rounded-md border"
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
                        if (index < existingImages.length) {
                          setExistingImages((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                        } else {
                          const newIndex = index - existingImages.length;
                          setPreviewUrls((prev) =>
                            prev.filter((_, i) => i !== newIndex),
                          );
                          setSelectedFiles((prev) =>
                            prev.filter((_, i) => i !== newIndex),
                          );
                        }
                        setIsImageDirty(true);
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
                {existingImages.length + previewUrls.length
                  ? 'Add More Images'
                  : 'Choose Images'}
              </Button>
              {existingImages.length + previewUrls.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setExistingImages([]);
                    setPreviewUrls([]);
                    setSelectedFiles([]);
                    setIsImageDirty(true);
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

          <div className="flex justify-end gap-3 pt-6 border-t">
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
              {isSubmitting ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
