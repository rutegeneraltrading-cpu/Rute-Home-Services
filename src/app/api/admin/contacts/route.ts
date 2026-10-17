import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/server/requireAdmin';

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const supabase = await createAdminClient();

    const { data: contacts, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      contacts: contacts || [],
      total: contacts?.length ?? 0,
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact messages' },
      { status: 500 },
    );
  }
}
