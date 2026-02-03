import { httpClient } from '@/lib/client/http';

export interface CreateUserDTO {
  email: string;
  name: string;
  full_name?: string;
  phone?: string;
  address?: string;
  role?: 'admin' | 'user' | 'worker';
}

export interface AdminCreateUserDTO {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserDTO {
  full_name?: string;
  name?: string;
  phone?: string;
  address?: string;
  role?: 'admin' | 'user' | 'worker';
  status?: 'active' | 'inactive' | 'suspended';
}

export interface User extends CreateUserDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
  created_at: string;
  status?: 'active' | 'inactive' | 'suspended';
}

/**
 * Fetch all users
 */
export const getUsersApi = (): Promise<{ users: User[] }> =>
  httpClient.get(`/api/admin/users`);

/**
 * Fetch single user by ID
 */
export const getUserApi = (id: string): Promise<User> =>
  httpClient.get(`/api/admin/users/${id}`);

/**
 * Create a new user
 */
export const createUserApi = (data: AdminCreateUserDTO): Promise<User> =>
  httpClient.post(`/api/admin/users`, data);

/**
 * Update user by ID
 */
export const updateUserApi = (id: string, data: UpdateUserDTO): Promise<User> =>
  httpClient.put(`/api/admin/users/${id}`, data);

/**
 * Delete user by ID
 */
export const deleteUserApi = (id: string): Promise<{ success: boolean }> =>
  httpClient.delete(`/api/admin/users/${id}`);
