/**
 * Query Layer - useQuery hooks
 * Handles data fetching and caching
 */

import { useQuery } from '@tanstack/react-query';
import { getProductsApi, getProductApi, Product } from './products.api';

// Query Keys for cache management
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: object) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

/**
 * Fetch all products
 */
export function useGetProducts() {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: async () => {
      const data = await getProductsApi();
      return data.products;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single product
 */
export function useGetProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProductApi(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id, // Only run if id exists
  });
}
