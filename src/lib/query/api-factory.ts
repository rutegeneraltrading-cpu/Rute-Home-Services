import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Generic mutation factory for API calls
 * Handles POST, PUT, DELETE operations with auto-invalidation
 */

interface MutationConfig<TData, TError = unknown> {
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  invalidateQueries?: (string | readonly unknown[])[];
}

export function useApiMutation<
  TData = unknown,
  TVariables = unknown,
  TError = unknown,
>({
  endpoint,
  method,
  onSuccess,
  onError,
  invalidateQueries = [],
}: MutationConfig<TData, TError>) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `API Error: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate related queries
      invalidateQueries.forEach((query) => {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(query) ? query : [query],
        });
      });
      onSuccess?.(data);
    },
    onError,
  });
}

/**
 * Generic query factory for GET requests
 * Returns useQuery hook
 */

interface QueryConfig<TData = unknown, TError = unknown> {
  endpoint: string;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

export function useApiQuery<TData = unknown, TError = unknown>({
  endpoint,
  enabled = true,
  staleTime = 1000 * 60 * 5, // 5 minutes
  gcTime = 1000 * 60 * 10, // 10 minutes
  onSuccess,
  onError,
}: QueryConfig<TData, TError>) {
  // Note: Import useQuery from @tanstack/react-query in your hook file
  // This is just the config factory
  return {
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return response.json() as Promise<TData>;
    },
    enabled,
    staleTime,
    gcTime,
    onSuccess,
    onError,
  };
}
