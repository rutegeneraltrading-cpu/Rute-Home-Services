import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user' | 'worker';
  avatar_url: string | null;
  created_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

/**
 * Get current authenticated user
 */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Not authenticated');
      return response.json() as Promise<AuthUser>;
    },
    retry: false, // Don't retry if not authenticated
  });
}

/**
 * Sign Up
 */
export function useSignUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SignUpData) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Set user data after successful signup
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}

/**
 * Sign In
 */
export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SignInData) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Set user data after successful login
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}

/**
 * Sign Out
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      return response.json();
    },
    onSuccess: () => {
      // Clear auth query data
      queryClient.setQueryData(authKeys.me(), null);
      queryClient.clear(); // Optional: clear all queries
    },
  });
}

/**
 * Update User Profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AuthUser>) => {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Update failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}
