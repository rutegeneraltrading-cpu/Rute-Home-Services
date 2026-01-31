'use server';

import { createClient } from '@/lib/supabase';
import { Service, PaginatedResponse } from '@/lib/types';

export async function getServices(
  page = 1,
  limit = 10,
  search = '',
  category = '',
): Promise<PaginatedResponse<Service>> {
  const supabase = await createClient();
  let query = supabase.from('services').select('*', { count: 'exact' });

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

export async function getServiceById(id: string): Promise<Service> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createService(
  service: Omit<Service, 'id' | 'created_at' | 'updated_at'>,
): Promise<Service> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .insert([service])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateService(
  id: string,
  updates: Partial<Service>,
): Promise<Service> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteService(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('services').delete().eq('id', id);

  if (error) throw error;
}

export async function getServiceCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('category')
    .eq('is_active', true);

  if (error) throw error;

  const categories = [...new Set(data?.map((s) => s.category) || [])];
  return categories.sort();
}
