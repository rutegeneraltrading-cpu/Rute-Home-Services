import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user from session (cookies)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user from session (cookies)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, avatar_url } = body;

    // Validate input
    if (!full_name && !avatar_url) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 },
      );
    }

    const updateData: Record<string, string> = {};
    if (full_name) updateData.full_name = full_name;
    if (avatar_url) updateData.avatar_url = avatar_url;

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ ...updateData, updated_at: new Date() })
      .eq('auth_id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 400 },
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
