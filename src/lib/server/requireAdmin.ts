import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Guard for admin-only API routes. `/api/*` is exempt from the page-level
 * middleware role check (src/middleware.ts marks it `alwaysAccessible`), so
 * every admin route must call this itself — there is no other backstop.
 *
 * Returns a 401/403 NextResponse to return immediately, or null to proceed.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}
