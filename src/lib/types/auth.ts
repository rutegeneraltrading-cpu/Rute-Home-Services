import { BaseEntity } from './common';

export type UserRole = 'admin' | 'user' | 'worker';

export interface User extends BaseEntity {
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
