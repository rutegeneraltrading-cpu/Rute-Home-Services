import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  signUpApi,
  signInApi,
  signOutApi,
  forgotPasswordApi,
  resetPasswordApi,
} from './auth.api';
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
          error?.message?.data?.message ||
          'Failed to create account. Please try again.',
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
        description: error?.data?.error || 'Invalid email or password.',
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
        description:
          error?.message?.data?.message ||
          'Failed to log out. Please try again.',
      });

      options?.onError?.(error);
    },
  });
}

/**
 * Forgot Password (Send Reset Email)
 */
export function useForgotPassword(options?: AuthMutationOptions) {
  return useMutation({
    mutationFn: (email: string) => forgotPasswordApi(email),
    onSuccess: () => {
      toast({
        variant: 'success',
        title: 'Check Your Email',
        description:
          'If an account exists, you will receive a password reset link.',
      });

      options?.onSuccess?.();
    },
    onError: (error: Error | any) => {
      console.error('Forgot password error:', error.message);

      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description:
          error?.message?.data?.message ||
          'Failed to send reset link. Please try again.',
      });

      options?.onError?.(error);
    },
  });
}

/**
 * Reset Password (Update Password)
 */
export function useResetPassword(options?: AuthMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (password: string) => resetPasswordApi(password),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.all });

      toast({
        variant: 'success',
        title: 'Password Updated',
        description: 'Your password has been successfully updated.',
      });

      options?.onSuccess?.();
    },
    onError: (error: Error | any) => {
      console.error('Reset password error:', error.message);

      toast({
        variant: 'destructive',
        title: 'Password Update Failed',
        description:
          error?.message?.data?.message ||
          'Failed to update password. Please try again.',
      });

      options?.onError?.(error);
    },
  });
}
