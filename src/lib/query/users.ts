import { useQuery } from '@tanstack/react-query';
import { useApiMutation } from './api-factory';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'worker';
  status: 'active' | 'inactive';
  created_at: string;
  avatar_url: string | null;
}

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: object) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

/**
 * Fetch all users
 */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return data.users as User[];
    },
  });
}

/**
 * Fetch single user
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json() as Promise<User>;
    },
    enabled: !!id,
  });
}

/**
 * Create user (using generic mutation)
 */
export function useCreateUser() {
  return useApiMutation<User, Omit<User, 'id' | 'created_at'>>({
    endpoint: '/api/admin/users',
    method: 'POST',
    invalidateQueries: [userKeys.all],
  });
}

/**
 * Update user (using generic mutation)
 */
export function useUpdateUser(userId: string) {
  return useApiMutation<User, Partial<User>>({
    endpoint: `/api/admin/users/${userId}`,
    method: 'PUT',
    invalidateQueries: [userKeys.all, userKeys.detail(userId)],
  });
}

/**
 * Delete user (using generic mutation)
 */
export function useDeleteUser() {
  return useApiMutation<void, string>({
    endpoint: '/api/admin/users',
    method: 'DELETE',
    invalidateQueries: [userKeys.all],
  });
}
