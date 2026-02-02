import { httpClient } from '@/lib/client/http';

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  display_order?: number;
  created_at: string;
}

export interface CreateServiceCategoryDTO {
  name: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Fetch all active service categories
 */
export const getCategoriesApi = (): Promise<{
  categories: ServiceCategory[];
  total: number;
}> => httpClient.get(`/api/admin/services/categories`);

/**
 * Create a new service category
 */
export const createCategoryApi = (
  data: CreateServiceCategoryDTO,
): Promise<{ category: ServiceCategory }> =>
  httpClient.post(`/api/admin/services/categories`, data);
