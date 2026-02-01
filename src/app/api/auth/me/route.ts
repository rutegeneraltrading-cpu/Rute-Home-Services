import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(null, { status: 200 });
    }

    // Fetch user profile
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();

    if (userError) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json({
      id: userData.auth_id,
      email: userData.email,
      name: userData.full_name,
      role: userData.role,
      avatar_url: userData.avatar_url,
      created_at: userData.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
