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

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user' | 'worker';
  avatar_url: string | null;
  created_at: string;
}
