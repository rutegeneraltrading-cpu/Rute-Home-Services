/**
 * Mutation Layer - useMutation hooks
 * Handles create, update, delete with error handling
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createServiceApi,
  createServiceOptionApi,
  CreateServiceDTO,
  CreateServiceOptionDTO,
  Service,
  ServiceOption,
} from './services.api';

// ============================================
// SERVICE MUTATIONS
// ============================================

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceDTO) => createServiceApi(data),
    onSuccess: (data: Service) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(`Service "${data.name}" created successfully!`);
    },
    onError: (error: Error) => {
      console.error('Error creating service:', error);
      toast.error(error.message || 'Failed to create service');
    },
  });
};

// ============================================
// SERVICE OPTIONS MUTATIONS
// ============================================

export const useCreateServiceOption = (serviceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceOptionDTO) =>
      createServiceOptionApi(serviceId, data),
    onSuccess: (data: ServiceOption) => {
      queryClient.invalidateQueries({
        queryKey: ['serviceOptions', serviceId],
      });
      toast.success(`Option "${data.name}" added successfully!`);
    },
    onError: (error: Error) => {
      console.error('Error creating service option:', error);
      toast.error(error.message || 'Failed to add option');
    },
  });
};
