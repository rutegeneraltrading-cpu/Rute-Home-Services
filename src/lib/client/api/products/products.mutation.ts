/**
 * Mutation Layer - useMutation hooks
 * Handles create, update, delete with error handling
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProductApi,
  updateProductApi,
  deleteProductApi,
  CreateProductDTO,
  UpdateProductDTO,
} from './products.api';
import { productKeys } from './products.query';

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
