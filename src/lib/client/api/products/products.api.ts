import { httpClient } from '@/lib/client/http';

// ============================================
// TYPES
// ============================================

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category_id: string;
  image_url?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  category?: {
    id: string;
    name: string;
  };
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category_id: string;
  image_url?: string;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category_id?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  created_at: string;
}

export interface CreateProductCategoryDTO {
  name: string;
  description?: string;
  image_url?: string;
}

export interface UpdateProductCategoryDTO {
  name?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
}

// ============================================
// PRODUCTS API
// ============================================

const BASE_URL = '/api/products';
const ADMIN_BASE_URL = '/api/admin';

// GET - Fetch all products
export const getProductsApi = (): Promise<{ products: Product[] }> =>
  httpClient.get(`${BASE_URL}`);

// GET - Fetch single product
export const getProductApi = (id: string): Promise<Product> =>
  httpClient.get(`${BASE_URL}/${id}`);

// POST - Create product
export const createProductApi = (data: CreateProductDTO): Promise<Product> =>
  httpClient.post(`${BASE_URL}`, data);

// PUT - Update product
export const updateProductApi = (
  id: string,
  data: UpdateProductDTO,
): Promise<Product> => httpClient.put(`${BASE_URL}/${id}`, data);

// DELETE - Delete product
export const deleteProductApi = (id: string): Promise<void> =>
  httpClient.delete(`${BASE_URL}/${id}`);

// ============================================
// PRODUCT CATEGORIES API
// ============================================

// GET - Fetch all categories
export const getProductCategoriesApi = (): Promise<ProductCategory[]> =>
  httpClient.get(`${ADMIN_BASE_URL}/product-categories`);

// GET - Fetch single category
export const getProductCategoryApi = (id: string): Promise<ProductCategory> =>
  httpClient.get(`${ADMIN_BASE_URL}/product-categories/${id}`);

// POST - Create category
export const createProductCategoryApi = (
  data: CreateProductCategoryDTO,
): Promise<ProductCategory> =>
  httpClient.post(`${ADMIN_BASE_URL}/product-categories`, data);

// PUT - Update category
export const updateProductCategoryApi = (
  id: string,
  data: UpdateProductCategoryDTO,
): Promise<ProductCategory> =>
  httpClient.put(`${ADMIN_BASE_URL}/product-categories/${id}`, data);

// DELETE - Delete category
export const deleteProductCategoryApi = (id: string): Promise<void> =>
  httpClient.delete(`${ADMIN_BASE_URL}/product-categories/${id}`);
