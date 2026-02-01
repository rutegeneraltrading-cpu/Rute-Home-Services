/**
 * Auth Mutation Layer - useMutation hooks
 * Handles sign in, sign up, sign out
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signUpApi, signInApi, signOutApi, updateProfileApi } from './auth.api';
import { authKeys } from './auth.query';

interface AuthMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Sign Up
 */
export function useSignUp(options?: AuthMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signUpApi,
    onSuccess: (data) => {
      // Cache user data after signup
      queryClient.setQueryData(authKeys.me(), data.user);
      // Also invalidate to refresh any other queries that depend on auth
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Sign up error:', error.message);
      options?.onError?.(error);
    },
  });
}

/**
 * Sign In
 */
export function useSignIn(options?: AuthMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signInApi,
    onSuccess: (data) => {
      // Cache user data after signin
      queryClient.setQueryData(authKeys.me(), data.user);
      // Also invalidate to refresh any other queries that depend on auth
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Sign in error:', error.message);
      options?.onError?.(error);
    },
  });
}

/**
 * Sign Out
 */
export function useSignOut(options?: AuthMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOutApi,
    onSuccess: () => {
      // Clear auth data
      queryClient.removeQueries({ queryKey: authKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Sign out error:', error.message);
      options?.onError?.(error);
    },
  });
}

/**
 * Update Profile
 */
export function useUpdateProfile(options?: AuthMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileApi,
    onSuccess: (data) => {
      // Update cached user data
      queryClient.setQueryData(authKeys.me(), data.user);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Update profile error:', error.message);
      options?.onError?.(error);
    },
  });
}
