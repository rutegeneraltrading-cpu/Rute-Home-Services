import { createClient } from '@/lib/supabase/client';

export async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}
