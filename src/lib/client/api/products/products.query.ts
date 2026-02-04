import { useQuery } from '@tanstack/react-query';
import {
  getProductsApi,
  getProductApi,
  getProductCategoriesApi,
  getProductCategoryApi,
} from './products.api';

// ============================================
// QUERY KEYS
// ============================================

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: object) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export const productCategoryKeys = {
  all: ['product-categories'] as const,
  lists: () => [...productCategoryKeys.all, 'list'] as const,
  details: () => [...productCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productCategoryKeys.details(), id] as const,
};

// ============================================
// PRODUCT QUERIES
// ============================================

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

// ============================================
// PRODUCT CATEGORY QUERIES
// ============================================

/**
 * Fetch all product categories
 */
export function useGetProductCategories() {
  return useQuery({
    queryKey: productCategoryKeys.lists(),
    queryFn: getProductCategoriesApi,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch single product category
 */
export function useGetProductCategory(id: string) {
  return useQuery({
    queryKey: productCategoryKeys.detail(id),
    queryFn: () => getProductCategoryApi(id),
    staleTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}
