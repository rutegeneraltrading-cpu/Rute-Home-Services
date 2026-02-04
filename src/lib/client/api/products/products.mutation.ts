import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProductApi,
  updateProductApi,
  deleteProductApi,
  createProductCategoryApi,
  updateProductCategoryApi,
  deleteProductCategoryApi,
  CreateProductDTO,
  UpdateProductDTO,
  CreateProductCategoryDTO,
  UpdateProductCategoryDTO,
} from './products.api';
import { productKeys, productCategoryKeys } from './products.query';

interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Create product
 */
export function useCreateProduct(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductDTO) => createProductApi(data),
    onSuccess: () => {
      // Refetch products list after creation
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Create product error:', error.message);
      options?.onError?.(error);
    },
  });
}

/**
 * Update product
 */
export function useUpdateProduct(productId: string, options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProductDTO) => updateProductApi(productId, data),
    onSuccess: () => {
      // Refetch product and products list
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Update product error:', error.message);
      options?.onError?.(error);
    },
  });
}

/**
 * Delete product
 */
export function useDeleteProduct(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProductApi(id),
    onSuccess: () => {
      // Refetch products list after deletion
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Delete product error:', error.message);
      options?.onError?.(error);
    },
  });
}

// ============================================
// PRODUCT CATEGORY MUTATIONS
// ============================================

/**
 * Create product category
 */
export function useCreateProductCategory(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductCategoryDTO) =>
      createProductCategoryApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.lists(),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Create category error:', error.message);
      options?.onError?.(error);
    },
  });
}

/**
 * Update product category
 */
export function useUpdateProductCategory(
  categoryId: string,
  options?: MutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProductCategoryDTO) =>
      updateProductCategoryApi(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.detail(categoryId),
      });
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.lists(),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Update category error:', error.message);
      options?.onError?.(error);
    },
  });
}

/**
 * Delete product category
 */
export function useDeleteProductCategory(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProductCategoryApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.lists(),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Delete category error:', error.message);
      options?.onError?.(error);
    },
  });
}
