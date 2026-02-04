import { httpClient } from '@/lib/client/http';

// ============================================
// TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  phone?: string;
  address?: string;
  role?: 'admin' | 'user' | 'worker';
  status?: 'active' | 'inactive' | 'suspended';
  created_at: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
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

// ============================================
// USERS API
// ============================================

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
