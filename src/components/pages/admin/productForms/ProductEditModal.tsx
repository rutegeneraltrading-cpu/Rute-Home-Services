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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageDirty, setIsImageDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultValues = useMemo(
    () => ({
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price ? String(product.price) : '',
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
      setSelectedFile(null);
      setPreviewUrl(product.image_url || '');
      setIsImageDirty(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [product, reset, defaultValues]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
    setIsImageDirty(true);
  };

  const onSubmit = async (data: ProductEditValues) => {
    if (!product) return;
    setIsSubmitting(true);
    try {
      let imageUrl = product.image_url;

      if (selectedFile) {
        setIsUploadingImage(true);
        toast.loading('Uploading image...');
        imageUrl = await uploadProductImage(selectedFile);
        toast.dismiss();
      }

      await updateProductMutation.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        price: parseFloat(data.price),
        category_id: data.category_id,
        stock: parseInt(data.stock, 10),
        image_url: imageUrl,
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
