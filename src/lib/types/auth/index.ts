// Auth-related types
export interface SignUpDTO {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface SignInDTO {
  email: string;
  password: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  password: string;
}

export interface ResetPasswordFormDTO extends ResetPasswordDTO {
  confirmPassword: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'admin' | 'user' | 'worker';
  avatar_url: string | null;
  created_at: string;
}
