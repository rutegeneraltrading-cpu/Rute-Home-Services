import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Sessions saved while logged in carry the profile id — this history
    // could embed that customer's real bookings/orders (see fetchUserContext
    // in src/app/api/chat/route.ts), so only that same customer may read it
    // back. Anonymous sessions (user_id null) carry no personal data, so
    // they're readable by anyone holding the (non-guessable) sessionId —
    // same trust level the chat widget itself relies on client-side.
    const { data: ownerRow } = await supabase
      .from('chat_sessions')
      .select('user_id')
      .eq('session_id', sessionId)
      .limit(1)
      .maybeSingle();

    if (ownerRow?.user_id) {
      const authClient = await createClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await authClient
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (profile?.id !== ownerRow.user_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const messages = (data || []).map((row, i) => ({
      id: `${sessionId}-${i}`,
      role: row.role as 'user' | 'assistant',
      content: row.content,
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Chat history GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
