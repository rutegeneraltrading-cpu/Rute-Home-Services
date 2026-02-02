/**
 * Query Layer - useQuery hooks
 * Handles data fetching and caching
 */

import { useQuery } from '@tanstack/react-query';
import { getServiceOptionsApi, getServicesApi } from './services.api';

// ============================================
// SERVICES QUERIES
// ============================================

export const useGetServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: getServicesApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ============================================
// SERVICE OPTIONS QUERIES
// ============================================

export const useGetServiceOptions = (serviceId: string) => {
  return useQuery({
    queryKey: ['serviceOptions', serviceId],
    queryFn: () => getServiceOptionsApi(serviceId),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
