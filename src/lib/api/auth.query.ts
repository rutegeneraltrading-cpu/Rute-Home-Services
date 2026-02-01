/**
 * Auth Query Layer - useQuery hooks
 */

import { useQuery } from '@tanstack/react-query';
import { getMeApi, AuthUser } from './auth.api';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

/**
 * Fetch current authenticated user
 */
export function useGetMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMeApi,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry if not authenticated
    select: (data) => data || undefined,
  });
}
