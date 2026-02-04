import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createServiceApi,
  updateServiceApi,
  deleteServiceApi,
  createServiceOptionApi,
  updateServiceOptionApi,
  deleteServiceOptionApi,
  CreateServiceDTO,
  UpdateServiceDTO,
  CreateServiceOptionDTO,
  UpdateServiceOptionDTO,
} from './services.api';
import { serviceKeys } from './services.query';

// ============================================
// SERVICE MUTATIONS
// ============================================

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceDTO) => createServiceApi(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      toast.success(`Service "${data.name}" created successfully!`);
    },
    onError: (error: Error) => {
      console.error('Error creating service:', error);
      toast.error(error.message || 'Failed to create service');
    },
  });
};

export const useUpdateService = (serviceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateServiceDTO) => updateServiceApi(serviceId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: serviceKeys.detail(serviceId),
      });
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      toast.success(`Service "${data.name}" updated successfully!`);
    },
    onError: (error: Error) => {
      console.error('Error updating service:', error);
      toast.error(error.message || 'Failed to update service');
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) => deleteServiceApi(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      toast.success('Service deleted successfully!');
    },
    onError: (error: Error) => {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Failed to delete service');
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: serviceKeys.options(serviceId),
      });
      toast.success(`Option "${data.name}" added successfully!`);
    },
    onError: (error: Error) => {
      console.error('Error creating service option:', error);
      toast.error(error.message || 'Failed to add option');
    },
  });
};

export const useUpdateServiceOption = (serviceId: string, optionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateServiceOptionDTO) =>
      updateServiceOptionApi(serviceId, optionId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: serviceKeys.options(serviceId),
      });
      toast.success(`Option "${data.name}" updated successfully!`);
    },
    onError: (error: Error) => {
      console.error('Error updating service option:', error);
      toast.error(error.message || 'Failed to update option');
    },
  });
};

export const useDeleteServiceOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      serviceId,
      optionId,
    }: {
      serviceId: string;
      optionId: string;
    }) => deleteServiceOptionApi(serviceId, optionId),
    onSuccess: (_, { serviceId }) => {
      queryClient.invalidateQueries({
        queryKey: serviceKeys.options(serviceId),
      });
      toast.success('Option deleted successfully!');
    },
    onError: (error: Error) => {
      console.error('Error deleting service option:', error);
      toast.error(error.message || 'Failed to delete option');
    },
  });
};
