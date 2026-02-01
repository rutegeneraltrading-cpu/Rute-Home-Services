import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Create an admin Supabase client using service role key
 * This bypasses RLS and authentication
 * Use only for server-side operations
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}
