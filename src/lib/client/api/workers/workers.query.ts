import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getWorkersApi, getWorkerApi, Worker } from './workers.api';
import { toast } from '@/components/ui/use-toast';

/**
 * Query key factory for workers
 */
export const workerKeys = {
  all: ['workers'] as const,
  lists: () => [...workerKeys.all, 'list'] as const,
  detail: (id: string) => [...workerKeys.all, 'detail', id] as const,
};

/**
 * Fetch all workers
 */
export const useGetWorkers = (
  options?: UseQueryOptions<{ workers: Worker[] }, Error>,
) => {
  const query = useQuery({
    queryKey: workerKeys.lists(),
    queryFn: getWorkersApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });

  // Show error toast
  if (query.error) {
    toast({
      variant: 'destructive',
      title: 'Failed to Load Workers',
      description: query.error.message || 'Could not fetch workers list.',
    });
  }

  return query;
};

/**
 * Fetch single worker by ID
 */
export const useGetWorker = (
  id: string | undefined,
  options?: UseQueryOptions<Worker, Error>,
) =>
  useQuery({
    queryKey: workerKeys.detail(id || ''),
    queryFn: () => getWorkerApi(id!),
    enabled: !!id, // Only run if ID is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
