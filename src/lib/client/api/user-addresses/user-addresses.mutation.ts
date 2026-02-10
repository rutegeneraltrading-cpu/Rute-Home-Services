import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createUserAddressApi,
  deleteUserAddressApi,
  updateUserAddressApi,
} from './user-addresses.api';
import type { CreateUserAddressDTO, UpdateUserAddressDTO } from '@/lib/types';
import { USER_ADDRESS_KEYS } from './user-addresses.query';
import { PROFILE_QUERY_KEYS } from '../profile/profile.query';
import { toast } from '@/components/ui/use-toast';

export const useCreateUserAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserAddressDTO) => createUserAddressApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_ADDRESS_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.detail() });
      toast({
        variant: 'success',
        title: 'Address Added',
        description: 'Your address has been added successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Add Failed',
        description: error.message || 'Failed to add address.',
      });
    },
  });
};

export const useUpdateUserAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserAddressDTO }) =>
      updateUserAddressApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_ADDRESS_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.detail() });
      toast({
        variant: 'success',
        title: 'Address Updated',
        description: 'Your address has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update address.',
      });
    },
  });
};

export const useDeleteUserAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUserAddressApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_ADDRESS_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.detail() });
      toast({
        variant: 'success',
        title: 'Address Deleted',
        description: 'Your address has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete address.',
      });
    },
  });
};
