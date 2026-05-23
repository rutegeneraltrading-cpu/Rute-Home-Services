import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const supabase = await createAdminClient();

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
