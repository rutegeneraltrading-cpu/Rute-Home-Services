/**
 * API Layer - Pure API calls
 * No React Query logic, just HTTP requests
 */

import { httpClient } from '@/lib/client/http';

const BASE_URL = '/api/services';

export interface CreateServiceDTO {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
}

export type UpdateServiceDTO = Partial<CreateServiceDTO>;

export interface Service extends CreateServiceDTO {
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// GET - Fetch all services
export const getServicesApi = (): Promise<{ services: Service[] }> =>
  httpClient.get(`${BASE_URL}`);

// GET - Fetch single service
export const getServiceApi = (id: string): Promise<Service> =>
  httpClient.get(`${BASE_URL}/${id}`);

// POST - Create service
export const createServiceApi = (data: CreateServiceDTO): Promise<Service> =>
  httpClient.post(`${BASE_URL}`, data);

// PUT - Update service
export const updateServiceApi = (
  id: string,
  data: UpdateServiceDTO,
): Promise<Service> => httpClient.put(`${BASE_URL}/${id}`, data);

// DELETE - Delete service
export const deleteServiceApi = (id: string): Promise<void> =>
  httpClient.delete(`${BASE_URL}/${id}`);
