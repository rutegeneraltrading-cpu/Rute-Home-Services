import { httpClient } from '@/lib/client/http';
import { CreateServiceCategoryDTO, ServiceCategory } from '@/lib/types';

export interface UpdateServiceCategoryDTO {
  name?: string;
  description?: string;
  image_url?: string;
  charge_type?: 'hourly' | 'day';
  service_fee?: number;
}

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

/**
 * Update a service category
 */
export const updateServiceCategoryApi = (
  id: string,
  data: UpdateServiceCategoryDTO,
): Promise<ServiceCategory> =>
  httpClient.put(`/api/admin/services/categories/${id}`, data);

/**
 * Delete a service category
 */
export const deleteServiceCategoryApi = (id: string): Promise<void> =>
  httpClient.delete(`/api/admin/services/categories/${id}`);
