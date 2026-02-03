import { httpClient } from '@/lib/client/http';

export interface Worker {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  avatar_url?: string | null;
  rating_avg?: number;
  hourly_rate?: number;
  is_active?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  role: 'worker';
  service_ids?: string[];
  service_names?: string[];
  service_category_names?: string[];
  created_at: string;
  updated_at?: string;
}

export interface CreateWorkerDTO {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  service_id: string;
  hourly_rate?: number;
}

export interface UpdateWorkerDTO {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  hourly_rate?: number;
  avatar_url?: string;
  status?: 'active' | 'inactive' | 'suspended';
  service_id?: string;
}

/**
 * Fetch all workers
 */
export const getWorkersApi = (): Promise<{
  workers: Worker[];
  total: number;
}> => httpClient.get(`/api/admin/workers/get`);

/**
 * Fetch single worker by ID
 */
export const getWorkerApi = (id: string): Promise<{ worker: Worker }> =>
  httpClient.get(`/api/admin/workers/${id}`);

/**
 * Create a new worker
 */
export const createWorkerApi = (
  data: CreateWorkerDTO,
): Promise<{ worker: Worker }> =>
  httpClient.post(`/api/admin/workers/create`, data);

/**
 * Update worker by ID
 */
export const updateWorkerApi = (
  id: string,
  data: UpdateWorkerDTO,
): Promise<{ worker: Worker }> =>
  httpClient.put(`/api/admin/workers/${id}`, data);

/**
 * Suspend a worker (prevent new bookings)
 */
export const suspendWorkerApi = (id: string): Promise<{ worker: Worker }> =>
  httpClient.patch(`/api/admin/workers/${id}`, { action: 'suspend' });

/**
 * Unsuspend a worker (allow new bookings)
 */
export const unsuspendWorkerApi = (id: string): Promise<{ worker: Worker }> =>
  httpClient.patch(`/api/admin/workers/${id}`, { action: 'unsuspend' });

/**
 * Delete worker by ID
 */
export const deleteWorkerApi = (id: string): Promise<{ success: boolean }> =>
  httpClient.delete(`/api/admin/workers/${id}`);
