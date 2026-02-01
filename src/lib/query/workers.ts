import { useQuery } from '@tanstack/react-query';
import { useApiMutation } from './api-factory';

export interface Worker {
  id: string;
  name: string;
  email: string;
  service_category: string;
  rating: number;
  status: 'active' | 'inactive' | 'suspended';
  hourly_rate: number;
  created_at: string;
  avatar_url: string | null;
}

// Query Keys
export const workerKeys = {
  all: ['workers'] as const,
  lists: () => [...workerKeys.all, 'list'] as const,
  list: (filters?: object) => [...workerKeys.lists(), { filters }] as const,
  details: () => [...workerKeys.all, 'detail'] as const,
  detail: (id: string) => [...workerKeys.details(), id] as const,
};

/**
 * Fetch all workers
 */
export function useWorkers() {
  return useQuery({
    queryKey: workerKeys.lists(),
    queryFn: async () => {
      const response = await fetch('/api/admin/workers');
      if (!response.ok) throw new Error('Failed to fetch workers');
      const data = await response.json();
      return data.workers as Worker[];
    },
  });
}

/**
 * Fetch single worker
 */
export function useWorker(id: string) {
  return useQuery({
    queryKey: workerKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/admin/workers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch worker');
      return response.json() as Promise<Worker>;
    },
    enabled: !!id,
  });
}

/**
 * Create worker (using generic mutation)
 */
export function useCreateWorker() {
  return useApiMutation<Worker, Omit<Worker, 'id' | 'created_at'>>({
    endpoint: '/api/admin/workers',
    method: 'POST',
    invalidateQueries: [workerKeys.all],
  });
}

/**
 * Update worker (using generic mutation)
 */
export function useUpdateWorker(workerId: string) {
  return useApiMutation<Worker, Partial<Worker>>({
    endpoint: `/api/admin/workers/${workerId}`,
    method: 'PUT',
    invalidateQueries: [workerKeys.all, workerKeys.detail(workerId)],
  });
}

/**
 * Delete worker (using generic mutation)
 */
export function useDeleteWorker() {
  return useApiMutation<void, string>({
    endpoint: '/api/admin/workers',
    method: 'DELETE',
    invalidateQueries: [workerKeys.all],
  });
}
