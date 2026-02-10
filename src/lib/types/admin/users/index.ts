export interface UserCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

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

export interface Profile {
  auth_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url: string | null;
  role: 'admin' | 'user' | 'worker';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  avatar_url?: string;
  phone?: string | null;
}
