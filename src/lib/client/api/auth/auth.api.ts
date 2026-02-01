import { httpClient } from '@/lib/client/http';
import { AuthUser, SignInDTO, SignUpDTO } from '@/lib/types';

const BASE_URL = '/api/auth';

// Re-export types for convenience
export type { AuthUser, SignInDTO, SignUpDTO };

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
