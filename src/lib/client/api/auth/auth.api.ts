import { httpClient } from '@/lib/client/http';
import {
  AuthUser,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  SignInDTO,
  SignUpDTO,
} from '@/lib/types';

const BASE_URL = '/api/auth';

export interface SignUpResponse {
  user: AuthUser;
  requires_email_verification?: boolean;
  message?: string;
}

// Re-export types for convenience
export type {
  AuthUser,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  SignInDTO,
  SignUpDTO,
};

// POST - Sign up
export const signUpApi = (data: SignUpDTO): Promise<SignUpResponse> =>
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

// POST - Forgot password (send reset email)
export const forgotPasswordApi = (
  data: ForgotPasswordDTO,
): Promise<{ message: string }> =>
  httpClient.post(`${BASE_URL}/forgot-password`, data);

// POST - Reset password (update password with token)
export const resetPasswordApi = (
  data: ResetPasswordDTO,
): Promise<{ message: string }> =>
  httpClient.post(`${BASE_URL}/reset-password`, data);
