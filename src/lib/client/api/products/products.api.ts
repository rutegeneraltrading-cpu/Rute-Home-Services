/**
 * API Layer - Pure API calls
 * No React Query logic, just HTTP requests
 */

import { httpClient } from '@/lib/client/http';

const BASE_URL = '/api/products';

export interface CreateProductDTO {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category_id: string;
  image_url?: string;
}

export type UpdateProductDTO = Partial<CreateProductDTO>;

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

// GET - Fetch all products
export const getProductsApi = (): Promise<{ products: Product[] }> =>
  httpClient.get(`${BASE_URL}`);

// GET - Fetch single product
export const getProductApi = (id: string): Promise<Product> =>
  httpClient.get(`${BASE_URL}/${id}`);
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
