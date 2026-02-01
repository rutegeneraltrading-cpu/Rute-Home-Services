import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getUsersApi, getUserApi, User } from './users.api';
import { toast } from '@/components/ui/use-toast';

/**
 * Query key factory for users
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

/**
 * Fetch all users
 */
export const useGetUsers = (
  options?: UseQueryOptions<{ users: User[] }, Error>,
) => {
  const query = useQuery({
    queryKey: userKeys.lists(),
    queryFn: getUsersApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });

  // Show error toast
  if (query.error) {
    toast({
      variant: 'destructive',
      title: 'Failed to Load Users',
      description: query.error.message || 'Could not fetch users list.',
    });
  }

  return query;
};

/**
 * Fetch single user by ID
 */
export const useGetUser = (
  id: string | undefined,
  options?: UseQueryOptions<User, Error>,
) =>
  useQuery({
    queryKey: userKeys.detail(id || ''),
    queryFn: () => getUserApi(id!),
    enabled: !!id, // Only run if ID is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
