/**
 * QUERY PATTERN REFERENCE
 * ========================
 *
 * This file shows how to use the generic query factory for all CRUD operations.
 * No need for separate mutation code - just use the factory!
 */

// ============================================================================
// 1. GENERIC MUTATION FACTORY - For POST, PUT, DELETE
// ============================================================================

/**
 * Example: Create a new product
 *
 * import { useApiMutation } from '@/lib/query/api-factory';
 *
 * const createProduct = useApiMutation<Product, CreateProductDTO>({
 *   endpoint: '/api/products',
 *   method: 'POST',
 *   invalidateQueries: [productKeys.all],
 *   onSuccess: () => console.log('Product created!'),
 * });
 *
 * // Usage:
 * await createProduct.mutateAsync({ name: 'Product X', price: 100 });
 */

// ============================================================================
// 2. AUTH HOOKS - Pre-built for all auth operations
// ============================================================================

/**
 * Pre-built auth hooks:
 *
 * import {
 *   useMe,           // Get current user
 *   useSignIn,       // Sign in with email/password
 *   useSignUp,       // Create new account
 *   useSignOut,      // Log out
 *   useUpdateProfile, // Update user profile
 * } from '@/lib/query/auth';
 *
 * Example: Login page
 * const loginMutation = useSignIn();
 * await loginMutation.mutateAsync({ email: 'user@example.com', password: 'pass123' });
 *
 * Example: Get current user
 * const { data: user, isLoading } = useMe();
 */

// ============================================================================
// 3. HOW TO CREATE QUERY HOOKS FOR NEW ENTITIES
// ============================================================================

/**
 * File: src/lib/query/products.ts
 *
 * import { useQuery } from '@tanstack/react-query';
 * import { useApiMutation } from './api-factory';
 *
 * interface Product {
 *   id: string;
 *   name: string;
 *   price: number;
 *   created_at: string;
 * }
 *
 * // Query Keys (for caching)
 * export const productKeys = {
 *   all: ['products'] as const,
 *   lists: () => [...productKeys.all, 'list'] as const,
 *   list: (filters?: object) => [...productKeys.lists(), { filters }] as const,
 *   details: () => [...productKeys.all, 'detail'] as const,
 *   detail: (id: string) => [...productKeys.details(), id] as const,
 * };
 *
 * // GET - Fetch all products
 * export function useProducts() {
 *   return useQuery({
 *     queryKey: productKeys.lists(),
 *     queryFn: async () => {
 *       const response = await fetch('/api/products');
 *       if (!response.ok) throw new Error('Failed to fetch');
 *       const data = await response.json();
 *       return data.products as Product[];
 *     },
 *   });
 * }
 *
 * // GET - Fetch single product
 * export function useProduct(id: string) {
 *   return useQuery({
 *     queryKey: productKeys.detail(id),
 *     queryFn: async () => {
 *       const response = await fetch(`/api/products/${id}`);
 *       if (!response.ok) throw new Error('Failed to fetch');
 *       return response.json() as Promise<Product>;
 *     },
 *     enabled: !!id,
 *   });
 * }
 *
 * // POST - Create product (using generic mutation)
 * export function useCreateProduct() {
 *   return useApiMutation<Product, Omit<Product, 'id' | 'created_at'>>({
 *     endpoint: '/api/products',
 *     method: 'POST',
 *     invalidateQueries: [productKeys.all],
 *   });
 * }
 *
 * // PUT - Update product (using generic mutation)
 * export function useUpdateProduct(productId: string) {
 *   return useApiMutation<Product, Partial<Product>>({
 *     endpoint: `/api/products/${productId}`,
 *     method: 'PUT',
 *     invalidateQueries: [productKeys.all, productKeys.detail(productId)],
 *   });
 * }
 *
 * // DELETE - Delete product (using generic mutation)
 * export function useDeleteProduct() {
 *   return useApiMutation<void, string>({
 *     endpoint: '/api/products',
 *     method: 'DELETE',
 *     invalidateQueries: [productKeys.all],
 *   });
 * }
 */

// ============================================================================
// 4. USING IN A COMPONENT
// ============================================================================

/**
 * Example: Product Management Page
 *
 * 'use client';
 *
 * import { useProducts, useDeleteProduct, useCreateProduct } from '@/lib/query/products';
 * import { DataTable } from '@/components/common';
 *
 * export default function ProductsPage() {
 *   // GET - Fetch data
 *   const { data: products = [], isLoading } = useProducts();
 *
 *   // POST - Create
 *   const createProduct = useCreateProduct();
 *
 *   // DELETE - Remove
 *   const deleteProduct = useDeleteProduct();
 *
 *   const handleCreate = async () => {
 *     try {
 *       await createProduct.mutateAsync({
 *         name: 'New Product',
 *         price: 99.99,
 *       });
 *       // Data auto-refreshes! No manual refetch needed.
 *     } catch (error) {
 *       console.error(error);
 *     }
 *   };
 *
 *   const handleDelete = async (id: string) => {
 *     try {
 *       await deleteProduct.mutateAsync(id);
 *       // Data auto-refreshes!
 *     } catch (error) {
 *       console.error(error);
 *     }
 *   };
 *
 *   return (
 *     <div className="p-6">
 *       <DataTable
 *         config={{
 *           data: products,
 *           columns: [...],
 *           actions: [
 *             {
 *               id: 'delete',
 *               label: 'Delete',
 *               onClick: (product) => handleDelete(product.id),
 *             },
 *           ],
 *           isLoading,
 *         }}
 *       />
 *     </div>
 *   );
 * }
 */

// ============================================================================
// 5. KEY FEATURES OF THIS PATTERN
// ============================================================================

/**
 * ✅ AUTOMATIC QUERY INVALIDATION
 *    After mutation, related queries auto-refetch
 *    invalidateQueries: [productKeys.all] = refetch all products
 *    invalidateQueries: [productKeys.detail(id)] = refetch single product
 *
 * ✅ ZERO BOILERPLATE
 *    Generic factory handles fetch, headers, error handling
 *    Just pass endpoint, method, and queries to invalidate
 *
 * ✅ TYPE SAFE
 *    Full TypeScript support for request and response types
 *
 * ✅ AUTO CACHING
 *    5 min stale time, 10 min cache duration
 *    Auto refetch on window focus
 *
 * ✅ LOADING STATES
 *    isPending = mutation in progress
 *    isLoading = initial fetch
 *    isFetching = background refetch
 */

// ============================================================================
// 6. PATTERN FOR ALL ENTITIES
// ============================================================================

/**
 * Users - DONE ✅
 * Workers - DONE ✅
 * Auth - DONE ✅
 *
 * For Products, Services, Orders, Bookings, Reports, etc:
 *
 * 1. Create src/lib/query/{entity}.ts
 * 2. Define interface and queryKeys
 * 3. Create useGet{Entities}() - useQuery hook
 * 4. Create useGet{Entity}(id) - useQuery hook for single
 * 5. Create useCreate{Entity}() - useApiMutation POST
 * 6. Create useUpdate{Entity}(id) - useApiMutation PUT
 * 7. Create useDelete{Entity}() - useApiMutation DELETE
 *
 * That's it! Same pattern for everything.
 */

// ============================================================================
// 7. QUICK COPY-PASTE TEMPLATE
// ============================================================================

/**
 * Template for new entity hooks:
 *
 * import { useQuery } from '@tanstack/react-query';
 * import { useApiMutation } from './api-factory';
 *
 * interface Item {
 *   id: string;
 *   name: string;
 *   created_at: string;
 * }
 *
 * export const itemKeys = {
 *   all: ['items'] as const,
 *   lists: () => [...itemKeys.all, 'list'] as const,
 *   details: () => [...itemKeys.all, 'detail'] as const,
 *   detail: (id: string) => [...itemKeys.details(), id] as const,
 * };
 *
 * export function useItems() {
 *   return useQuery({
 *     queryKey: itemKeys.lists(),
 *     queryFn: async () => {
 *       const response = await fetch('/api/items');
 *       if (!response.ok) throw new Error('Failed to fetch');
 *       const data = await response.json();
 *       return data.items as Item[];
 *     },
 *   });
 * }
 *
 * export function useCreateItem() {
 *   return useApiMutation<Item, Omit<Item, 'id' | 'created_at'>>({
 *     endpoint: '/api/items',
 *     method: 'POST',
 *     invalidateQueries: [itemKeys.all],
 *   });
 * }
 *
 * export function useUpdateItem(itemId: string) {
 *   return useApiMutation<Item, Partial<Item>>({
 *     endpoint: `/api/items/${itemId}`,
 *     method: 'PUT',
 *     invalidateQueries: [itemKeys.all, itemKeys.detail(itemId)],
 *   });
 * }
 *
 * export function useDeleteItem() {
 *   return useApiMutation<void, string>({
 *     endpoint: '/api/items',
 *     method: 'DELETE',
 *     invalidateQueries: [itemKeys.all],
 *   });
 * }
 */
