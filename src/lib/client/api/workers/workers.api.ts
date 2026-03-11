import { httpClient } from '@/lib/client/http';
import type { CreateUserAddressDTO, UserAddress } from '@/lib/types';

export interface WorkerProfile {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  rating_avg?: number;
  is_active?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  role: 'worker';
  primary_address?: UserAddress | null;
  service_ids?: string[];
  service_names?: string[];
  service_category_names?: string[];
  created_at: string;
  updated_at?: string;
  worker_documents?: Array<{
    document_type: string;
    file_url: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
}

// Extended type for admin worker table with tooltip details
export interface WorkerProfileWithDetails extends WorkerProfile {
  service_category_details?: { name: string; charge_type: string }[];
  service_details?: {
    name: string;
    base_price: number;
    category_name: string;
    charge_type: string;
  }[];
}

export interface CreateWorkerDTO {
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  service_ids: string[];
  address: CreateUserAddressDTO;
  profile_status?: 'active' | 'inactive' | 'suspended';
  documents?: Array<{ type: string; file_url: string }>;
}

export interface UpdateWorkerDTO {
  full_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  status?: 'active' | 'inactive' | 'suspended';
  service_ids?: string[];
  address?: CreateUserAddressDTO;
  worker_documents?: any;
}

/**
 * Fetch all workers
 */
export const getWorkersApi = (): Promise<{
  workers: WorkerProfile[];
  total: number;
}> => httpClient.get(`/api/admin/workers/get`);

/**
 * Fetch single worker by ID
 */
export const getWorkerApi = (id: string): Promise<{ worker: WorkerProfile }> =>
  httpClient.get(`/api/admin/workers/${id}`);

/**
 * Create a new worker
 */
export const createWorkerApi = (
  data: CreateWorkerDTO,
): Promise<{ worker: WorkerProfile }> =>
  httpClient.post(`/api/admin/workers/create`, data);

/**
 * Update worker by ID
 */
export const updateWorkerApi = (
  id: string,
  data: UpdateWorkerDTO,
): Promise<{ worker: WorkerProfile }> =>
  httpClient.put(`/api/admin/workers/${id}`, data);

/**
 * Suspend a worker (prevent new bookings)
 */
export const suspendWorkerApi = (
  id: string,
): Promise<{ worker: WorkerProfile }> =>
  httpClient.patch(`/api/admin/workers/${id}`, { action: 'suspend' });

/**
 * Unsuspend a worker (allow new bookings)
 */
export const unsuspendWorkerApi = (
  id: string,
): Promise<{ worker: WorkerProfile }> =>
  httpClient.patch(`/api/admin/workers/${id}`, { action: 'unsuspend' });

/**
 * Delete worker by ID
 */
export const deleteWorkerApi = (id: string): Promise<{ success: boolean }> =>
  httpClient.delete(`/api/admin/workers/${id}`);
