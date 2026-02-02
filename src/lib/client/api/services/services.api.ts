/**
 * API Layer - Pure API calls for Services & Service Options
 * No React Query logic, just HTTP requests
 */

import { httpClient } from '@/lib/client/http/client';

// ============================================
// TYPES
// ============================================

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

// ============================================
// SERVICES API
// ============================================

export const getServicesApi = async (): Promise<Service[]> => {
  return httpClient.get('/api/admin/services');
};

export const createServiceApi = async (
  data: CreateServiceDTO,
): Promise<Service> => {
  return httpClient.post('/api/admin/services', data);
};

// ============================================
// SERVICE OPTIONS API
// ============================================

export const getServiceOptionsApi = async (
  serviceId: string,
): Promise<ServiceOption[]> => {
  return httpClient.get(`/api/admin/services/${serviceId}/options`);
};

export const createServiceOptionApi = async (
  serviceId: string,
  data: CreateServiceOptionDTO,
): Promise<ServiceOption> => {
  return httpClient.post(`/api/admin/services/${serviceId}/options`, data);
};
