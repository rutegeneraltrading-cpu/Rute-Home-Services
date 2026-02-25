// ============================================
// SERVICE OPTION VARIANTS QUERIES
// ============================================
import {
  getServiceOptionVariantsApi,
  getServiceOptionVariantApi,
} from './services.api';

export const useGetServiceOptionVariants = () => {
  return useQuery({
    queryKey: ['service_option_variants'],
    queryFn: getServiceOptionVariantsApi,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetServiceOptionVariant = (variantId: string) => {
  return useQuery({
    queryKey: ['service_option_variant', variantId],
    queryFn: () => getServiceOptionVariantApi(variantId),
    enabled: !!variantId,
    staleTime: 5 * 60 * 1000,
  });
};
import { useQuery } from '@tanstack/react-query';
import {
  getServicesApi,
  getServiceApi,
  getServiceOptionsApi,
  getServiceOptionApi,
} from './services.api';

// ============================================
// QUERY KEYS
// ============================================

export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
  options: (serviceId: string) =>
    [...serviceKeys.all, 'options', serviceId] as const,
  option: (serviceId: string, optionId: string) =>
    [...serviceKeys.options(serviceId), optionId] as const,
};

// ============================================
// SERVICES QUERIES
// ============================================

export const useGetServices = () => {
  return useQuery({
    queryKey: serviceKeys.lists(),
    queryFn: getServicesApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGetService = (id: string) => {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => getServiceApi(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// SERVICE OPTIONS QUERIES
// ============================================

export const useGetServiceOptions = (serviceId: string) => {
  return useQuery({
    queryKey: serviceKeys.options(serviceId),
    queryFn: () => getServiceOptionsApi(serviceId),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGetServiceOption = (serviceId: string, optionId: string) => {
  return useQuery({
    queryKey: serviceKeys.option(serviceId, optionId),
    queryFn: () => getServiceOptionApi(serviceId, optionId),
    enabled: !!serviceId && !!optionId,
    staleTime: 5 * 60 * 1000,
  });
};
