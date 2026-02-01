/**
 * Auth API Layer - Pure API calls
 */

import { httpClient } from '@/lib/http/client';

const BASE_URL = '/api/auth';

export interface SignUpDTO {
  email: string;
  password: string;
  name: string;
}

export interface SignInDTO {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user' | 'worker';
  avatar_url: string | null;
  created_at: string;
}

// POST - Sign up
export const signUpApi = (data: SignUpDTO): Promise<{ user: AuthUser }> =>
  httpClient.post(`${BASE_URL}/signup`, data);

// POST - Sign in
export const signInApi = (data: SignInDTO): Promise<{ user: AuthUser }> =>
  httpClient.post(`${BASE_URL}/login`, data);

// POST - Sign out
export const signOutApi = (): Promise<void> =>
  httpClient.post(`${BASE_URL}/logout`, {});

// GET - Get current user
export const getMeApi = (): Promise<AuthUser> =>
  httpClient.get(`${BASE_URL}/me`);

// PUT - Update profile
export const updateProfileApi = (
  data: Partial<AuthUser>,
): Promise<{ user: AuthUser }> => httpClient.put(`${BASE_URL}/profile`, data);
