import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Sign in
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Fetch user profile
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', data.user.id)
      .single();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Check if user is a worker - workers cannot login
    if (userData.role === 'worker') {
      // Sign out the user
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    return NextResponse.json({
      user: {
        id: userData.auth_id,
        email: userData.email,
        name: userData.full_name,
        role: userData.role,
        avatar_url: userData.avatar_url,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
