/**
 * Query Layer - useQuery hooks
 * Handles data fetching and caching
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getServicesApi, getServiceApi, Service } from './services.api';

// Query Keys for cache management
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters?: object) => [...serviceKeys.lists(), { filters }] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
};

/**
 * Hook to fetch all services
 */
export function useGetServices(options?: UseQueryOptions<Service[]>) {
  return useQuery({
    queryKey: serviceKeys.lists(),
    queryFn: async () => {
      const data = await getServicesApi();
      return data.services;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch single service by ID
 */
export function useGetService(id: string, options?: UseQueryOptions<Service>) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => getServiceApi(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}
