// ============================================
// SERVICE REQUIREMENTS API
// ============================================
import type {
  ServiceRequirement,
  CreateServiceRequirementDTO,
  UpdateServiceRequirementDTO,
} from '@/lib/types/admin/services/variant';

// Get all requirements (admin, with joins)
export const getServiceRequirementsApi = async (): Promise<
  ServiceRequirement[]
> => {
  return httpClient.get('/api/admin/services/requirements');
};

// Get single requirement
export const getServiceRequirementApi = async (
  requirementId: string,
): Promise<ServiceRequirement> => {
  return httpClient.get(`/api/admin/services/requirements/${requirementId}`);
};

// Create requirement
export const createServiceRequirementApi = async (
  data: CreateServiceRequirementDTO,
): Promise<ServiceRequirement> => {
  return httpClient.post('/api/admin/services/requirements', data);
};

// Update requirement
export const updateServiceRequirementApi = async (
  requirementId: string,
  data: UpdateServiceRequirementDTO,
): Promise<ServiceRequirement> => {
  return httpClient.put(
    `/api/admin/services/requirements/${requirementId}`,
    data,
  );
};

// Delete requirement
export const deleteServiceRequirementApi = async (
  requirementId: string,
): Promise<void> => {
  return httpClient.delete(`/api/admin/services/requirements/${requirementId}`);
};

// Backward-compatible aliases
export const getServiceOptionVariantsApi = getServiceRequirementsApi;
export const getServiceOptionVariantApi = getServiceRequirementApi;
export const createServiceOptionVariantApi = createServiceRequirementApi;
export const updateServiceOptionVariantApi = updateServiceRequirementApi;
export const deleteServiceOptionVariantApi = deleteServiceRequirementApi;
import { httpClient } from '@/lib/client/http/client';

export interface Service {
  id: string;
  name: string;
  slug: string;
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
  platform_fee: number;
  priority_fee?: number;
  app_fee?: number;
}

export interface CreateServiceDTO {
  name: string;
  slug: string;
  description?: string;
  base_price: number;
  category_id: string;
  duration_minutes?: number;
  platform_fee: number;
  priority_fee: number;
  app_fee: number;
}

export interface UpdateServiceDTO {
  name?: string;
  slug?: string;
  description?: string;
  base_price?: number;
  category_id?: string;
  duration_minutes?: number;
  is_active?: boolean;
  platform_fee?: number;
  priority_fee?: number;
  app_fee?: number;
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
  type: string;
  platform_fee: number;
}

export interface CreateServiceOptionDTO {
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  is_required?: boolean;
  display_order?: number;
  type: string;
  platform_fee: number;
}

export interface UpdateServiceOptionDTO {
  name?: string;
  description?: string;
  price?: number;
  duration_minutes?: number;
  is_required?: boolean;
  display_order?: number;
  is_active?: boolean;
  type?: string;
  platform_fee?: number;
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

export const getAllServiceOptionsApi = async (): Promise<ServiceOption[]> => {
  return httpClient.get('/api/admin/service_options');
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
  _serviceId: string,
  optionId: string,
  data: UpdateServiceOptionDTO,
): Promise<ServiceOption> => {
  // Use flat route for update
  return httpClient.put(`/api/admin/services/options/${optionId}`, data);
};

export const deleteServiceOptionApi = async (
  _serviceId: string,
  optionId: string,
): Promise<void> => {
  // Use flat route for delete
  return httpClient.delete(`/api/admin/services/options/${optionId}`);
};
