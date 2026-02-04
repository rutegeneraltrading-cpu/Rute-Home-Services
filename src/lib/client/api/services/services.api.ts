import { httpClient } from '@/lib/client/http/client';

export interface Service {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  category_id: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CreateServiceDTO {
  name: string;
  description?: string;
  base_price: number;
  category_id: string;
  duration_minutes?: number;
}

export interface UpdateServiceDTO {
  name?: string;
  description?: string;
  base_price?: number;
  category_id?: string;
  duration_minutes?: number;
  is_active?: boolean;
}

export interface ServiceOption {
  id: string;
  service_id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  is_required: boolean;
  display_order?: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateServiceOptionDTO {
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  is_required?: boolean;
  display_order?: number;
}

export interface UpdateServiceOptionDTO {
  name?: string;
  description?: string;
  price?: number;
  duration_minutes?: number;
  is_required?: boolean;
  display_order?: number;
  is_active?: boolean;
}

// ============================================
// SERVICES API
// ============================================

export const getServicesApi = async (): Promise<Service[]> => {
  return httpClient.get('/api/admin/services');
};

export const getServiceApi = async (id: string): Promise<Service> => {
  return httpClient.get(`/api/admin/services/${id}`);
};

export const createServiceApi = async (
  data: CreateServiceDTO,
): Promise<Service> => {
  return httpClient.post('/api/admin/services', data);
};

export const updateServiceApi = async (
  id: string,
  data: UpdateServiceDTO,
): Promise<Service> => {
  return httpClient.put(`/api/admin/services/${id}`, data);
};

export const deleteServiceApi = async (id: string): Promise<void> => {
  return httpClient.delete(`/api/admin/services/${id}`);
};

// ============================================
// SERVICE OPTIONS API
// ============================================

export const getServiceOptionsApi = async (
  serviceId: string,
): Promise<ServiceOption[]> => {
  return httpClient.get(`/api/admin/services/${serviceId}/options`);
};

export const getServiceOptionApi = async (
  serviceId: string,
  optionId: string,
): Promise<ServiceOption> => {
  return httpClient.get(`/api/admin/services/${serviceId}/options/${optionId}`);
};

export const createServiceOptionApi = async (
  serviceId: string,
  data: CreateServiceOptionDTO,
): Promise<ServiceOption> => {
  return httpClient.post(`/api/admin/services/${serviceId}/options`, data);
};

export const updateServiceOptionApi = async (
  serviceId: string,
  optionId: string,
  data: UpdateServiceOptionDTO,
): Promise<ServiceOption> => {
  return httpClient.put(
    `/api/admin/services/${serviceId}/options/${optionId}`,
    data,
  );
};

export const deleteServiceOptionApi = async (
  serviceId: string,
  optionId: string,
): Promise<void> => {
  return httpClient.delete(
    `/api/admin/services/${serviceId}/options/${optionId}`,
  );
};
