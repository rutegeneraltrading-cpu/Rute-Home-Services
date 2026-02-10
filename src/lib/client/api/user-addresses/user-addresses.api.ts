import { httpClient } from '@/lib/client/http';
import type {
  CreateUserAddressDTO,
  UpdateUserAddressDTO,
  UserAddress,
} from '@/lib/types';

export const getUserAddressesApi = (): Promise<{ addresses: UserAddress[] }> =>
  httpClient.get('/api/user/addresses');

export const createUserAddressApi = (
  data: CreateUserAddressDTO,
): Promise<UserAddress> => httpClient.post('/api/user/addresses', data);

export const updateUserAddressApi = (
  id: string,
  data: UpdateUserAddressDTO,
): Promise<UserAddress> => httpClient.put(`/api/user/addresses/${id}`, data);

export const deleteUserAddressApi = (
  id: string,
): Promise<{ success: boolean }> =>
  httpClient.delete(`/api/user/addresses/${id}`);
