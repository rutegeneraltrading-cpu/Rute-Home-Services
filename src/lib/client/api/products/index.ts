export * from './products.api';
export * from './products.query';
export * from './products.mutation';

// Re-export types for convenience
export type {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  ProductCategory,
  CreateProductCategoryDTO,
  UpdateProductCategoryDTO,
} from './products.api';
