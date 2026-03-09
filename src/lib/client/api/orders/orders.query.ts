import { useQuery } from '@tanstack/react-query';
import { getOrderApi, getOrdersApi } from './orders.api';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

export const useGetOrders = () => {
  return useQuery({
    queryKey: orderKeys.lists(),
    queryFn: getOrdersApi,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetOrder = (orderId: string) => {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrderApi(orderId),
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000,
  });
};
