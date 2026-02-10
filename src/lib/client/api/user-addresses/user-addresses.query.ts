import { useQuery } from '@tanstack/react-query';
import { getUserAddressesApi } from './user-addresses.api';

export const USER_ADDRESS_KEYS = {
  all: ['user-addresses'] as const,
  list: () => [...USER_ADDRESS_KEYS.all, 'list'] as const,
};

export const useGetUserAddresses = () => {
  return useQuery({
    queryKey: USER_ADDRESS_KEYS.list(),
    queryFn: getUserAddressesApi,
    staleTime: 5 * 60 * 1000,
  });
};
