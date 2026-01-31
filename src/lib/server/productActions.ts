'use server';

import { createClient } from '@/lib/supabase';
import { Product, PaginatedResponse } from '@/lib/types';

export async function getProducts(
  page = 1,
  limit = 10,
  search = '',
  category = '',
): Promise<PaginatedResponse<Product>> {
  const supabase = await createClient();
  let query = supabase.from('products').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data, count, error } = await query
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    limit,
  };
}

export async function getProductById(id: string): Promise<Product> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProduct(
  product: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
): Promise<Product> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>,
): Promise<Product> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) throw error;
}

export async function getProductCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('is_active', true);

  if (error) throw error;

  const categories = [...new Set(data?.map((p) => p.category) || [])];
  return categories.sort();
}
