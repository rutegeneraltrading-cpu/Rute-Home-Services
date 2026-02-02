import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createWorkerApi,
  updateWorkerApi,
  suspendWorkerApi,
  unsuspendWorkerApi,
  UpdateWorkerDTO,
} from './workers.api';
import { workerKeys } from './workers.query';
import { toast } from '@/components/ui/use-toast';

/**
 * Create a new worker
 */
export const useCreateWorker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkerApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      toast({
        variant: 'success',
        title: 'Worker Created',
        description: `${data.worker.full_name} has been added as a worker.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Create Worker',
        description: error.message || 'Could not create worker.',
      });
    },
  });
};

/**
 * Update worker by ID
 */
export const useUpdateWorker = (workerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerDTO) => updateWorkerApi(workerId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workerKeys.detail(workerId) });
      toast({
        variant: 'success',
        title: 'Worker Updated',
        description: `${data.worker.full_name}'s profile has been updated.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Update Worker',
        description: error.message || 'Could not update worker.',
      });
    },
  });
};

/**
 * Suspend a worker
 */
export const useSuspendWorker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: suspendWorkerApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: workerKeys.detail(data.worker.id),
      });
      toast({
        variant: 'destructive',
        title: 'Worker Suspended',
        description: `${data.worker.full_name} is now suspended and cannot accept new bookings.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Suspend Worker',
        description: error.message || 'Could not suspend worker.',
      });
    },
  });
};

/**
 * Unsuspend a worker
 */
export const useUnsuspendWorker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unsuspendWorkerApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: workerKeys.detail(data.worker.id),
      });
      toast({
        variant: 'success',
        title: 'Worker Reactivated',
        description: `${data.worker.full_name} can now accept new bookings.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Reactivate Worker',
        description: error.message || 'Could not reactivate worker.',
      });
    },
  });
};
