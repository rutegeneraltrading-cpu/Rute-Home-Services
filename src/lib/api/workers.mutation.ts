import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createWorkerApi,
  updateWorkerApi,
  deleteWorkerApi,
  UpdateWorkerDTO,
} from './workers.api';
import { workerKeys } from './workers.query';

interface WorkerMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Create a new worker
 */
export const useCreateWorker = (options?: WorkerMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkerApi,
    onSuccess: () => {
      // Invalidate workers list cache
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Create worker error:', error);
      options?.onError?.(error);
    },
  });
};

/**
 * Update worker by ID
 */
export const useUpdateWorker = (
  workerId: string,
  options?: WorkerMutationOptions,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerDTO) => updateWorkerApi(workerId, data),
    onSuccess: () => {
      // Invalidate both list and detail cache
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workerKeys.detail(workerId) });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Update worker error:', error);
      options?.onError?.(error);
    },
  });
};

/**
 * Delete worker by ID
 */
export const useDeleteWorker = (options?: WorkerMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkerApi,
    onSuccess: () => {
      // Invalidate workers list cache
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Delete worker error:', error);
      options?.onError?.(error);
    },
  });
};
