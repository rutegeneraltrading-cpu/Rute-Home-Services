/**
 * Mutation Layer - useMutation hooks
 * Handles create, update, delete with error handling
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createServiceApi,
  updateServiceApi,
  deleteServiceApi,
  CreateServiceDTO,
  UpdateServiceDTO,
} from './services.api';
import { serviceKeys } from './services.query';

interface ServiceMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Mutation hook to create a new service
 */
export function useCreateService(options?: ServiceMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceDTO) => createServiceApi(data),
    onSuccess: () => {
      // Invalidate services list to refetch
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * Mutation hook to update a service
 */
export function useUpdateService(options?: ServiceMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceDTO }) =>
      updateServiceApi(id, data),
    onSuccess: (_, variables) => {
      // Invalidate both list and detail query
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: serviceKeys.detail(variables.id),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * Mutation hook to delete a service
 */
export function useDeleteService(options?: ServiceMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteServiceApi(id),
    onSuccess: () => {
      // Invalidate services list to refetch
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
