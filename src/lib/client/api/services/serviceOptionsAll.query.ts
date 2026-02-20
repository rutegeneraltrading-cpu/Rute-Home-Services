import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/lib/client/http/client';
import type { ServiceOption } from './services.api';

// Get all service options (not by serviceId)
export const getAllServiceOptionsApi = async (): Promise<ServiceOption[]> => {
  return httpClient.get('/api/admin/service_options');
};

export const useGetAllServiceOptions = () => {
  return useQuery({
    queryKey: ['service_options', 'all'],
    queryFn: getAllServiceOptionsApi,
    staleTime: 5 * 60 * 1000,
  });
};
