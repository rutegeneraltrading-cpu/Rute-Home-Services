/**
 * Auth Mutation Layer - useMutation hooks
 * Handles sign in, sign up, sign out
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signUpApi, signInApi, signOutApi } from './auth.api';
import { authKeys } from './auth.query';
import { toast } from '@/components/ui/use-toast';

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

      toast({
        variant: 'success',
        title: 'Account Created!',
        description: 'Welcome! Your account has been created successfully.',
      });

      options?.onSuccess?.();
    },
    onError: (error: Error | any) => {
      console.error('Sign up error:', error.message);

      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description:
          error?.message?.data?.message || 'Failed to create account. Please try again.',
      });

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

      toast({
        variant: 'success',
        title: 'Welcome Back!',
        description: 'You have successfully logged in.',
      });

      options?.onSuccess?.();
    },
    onError: (error: Error | any) => {
      console.error('Sign in error:', error.message);

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error?.message?.data?.message || 'Invalid email or password.',
      });

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

      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });

      options?.onSuccess?.();
    },
    onError: (error: Error | any) => {
      console.error('Sign out error:', error.message);

      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: error?.message?.data?.message || 'Failed to log out. Please try again.',
      });

      options?.onError?.(error);
    },
  });
}
