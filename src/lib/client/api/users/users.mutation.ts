import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createUserApi,
  updateUserApi,
  deleteUserApi,
  UpdateUserDTO,
} from './users.api';
import { userKeys } from './users.query';

interface UserMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Create a new user
 */
export const useCreateUser = (options?: UserMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      // Invalidate users list cache
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Create user error:', error);
      options?.onError?.(error);
    },
  });
};

/**
 * Update user by ID
 */
export const useUpdateUser = (
  userId: string,
  options?: UserMutationOptions,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserDTO) => updateUserApi(userId, data),
    onSuccess: () => {
      // Invalidate both list and detail cache
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Update user error:', error);
      options?.onError?.(error);
    },
  });
};

/**
 * Delete user by ID
 */
export const useDeleteUser = (options?: UserMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUserApi,
    onSuccess: () => {
      // Invalidate users list cache
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Delete user error:', error);
      options?.onError?.(error);
    },
  });
};
