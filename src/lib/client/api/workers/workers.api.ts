import { httpClient } from '@/lib/client/http/client';

export interface CreateWorkerDTO {
  email: string;
  name: string;
  phone?: string;
  address?: string;
  serviceCategory?: string;
  rating?: number;
}

export interface UpdateWorkerDTO {
  name?: string;
  phone?: string;
  address?: string;
  serviceCategory?: string;
}

export interface Worker extends CreateWorkerDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
  created_at: string;
  status?: 'active' | 'inactive' | 'suspended';
  service_category?: string;
  hourly_rate?: number;
}

/**
 * Fetch all workers
 */
export const getWorkersApi = (): Promise<{ workers: Worker[] }> =>
  httpClient.get(`/api/admin/workers`);

/**
 * Fetch single worker by ID
 */
export const getWorkerApi = (id: string): Promise<Worker> =>
  httpClient.get(`/api/admin/workers/${id}`);

/**
 * Create a new worker
 */
export const createWorkerApi = (data: CreateWorkerDTO): Promise<Worker> =>
  httpClient.post(`/api/admin/workers`, data);

/**
 * Update worker by ID
 */
export const updateWorkerApi = (
  id: string,
  data: UpdateWorkerDTO,
): Promise<Worker> => httpClient.put(`/api/admin/workers/${id}`, data);

/**
 * Delete worker by ID
 */
export const deleteWorkerApi = (id: string): Promise<{ success: boolean }> =>
  httpClient.delete(`/api/admin/workers/${id}`);
