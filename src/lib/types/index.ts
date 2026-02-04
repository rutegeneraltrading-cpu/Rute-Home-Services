export * from './auth';
export * from './admin';
export * from './common';
export * from './table';

// Re-export types from API modules for backward compatibility
export type {
  User,
  AdminCreateUserDTO,
  UpdateUserDTO,
} from '@/lib/client/api/users';

export type {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  ProductCategory,
  CreateProductCategoryDTO,
  UpdateProductCategoryDTO,
} from '@/lib/client/api/products';

export type { Profile, UpdateProfileRequest } from './admin/users';
