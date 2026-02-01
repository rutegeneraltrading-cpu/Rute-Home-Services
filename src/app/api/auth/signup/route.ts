import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // 1. VALIDATE INPUT
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // 2. SIGN UP USER WITH SUPABASE AUTH
    const { error: authError, data: authData } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 },
      );
    }

    // 3. WAIT FOR TRIGGER TO CREATE PROFILE
    // Supabase trigger automatically creates profile on auth user creation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 4. FETCH AUTO-CREATED PROFILE (using admin client to bypass RLS)
    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Profile creation failed. Please try again.' },
        { status: 400 },
      );
    }

    // 5. RETURN USER DATA
    return NextResponse.json(
      {
        user: {
          id: profile.auth_id,
          email: profile.email,
          name: profile.full_name,
          role: profile.role,
          avatar_url: profile.avatar_url || null,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
