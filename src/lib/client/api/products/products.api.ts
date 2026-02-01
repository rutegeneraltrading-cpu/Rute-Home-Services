/**
 * API Layer - Pure API calls
 * No React Query logic, just HTTP requests
 */

import { httpClient } from '@/lib/client/http';

const BASE_URL = '/api/products';

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

export type UpdateProductDTO = Partial<CreateProductDTO>;

export interface Product extends CreateProductDTO {
  id: string;
  created_at: string;
  updated_at: string;
}

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
