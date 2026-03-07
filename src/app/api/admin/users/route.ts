import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(
        'auth_id, full_name, email, phone, avatar_url, role, status, created_at, updated_at',
      )
      .eq('role', 'user')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map auth_id to id for consistency with User type
    const users =
      profiles?.map((profile) => ({
        ...profile,
        id: profile.auth_id,
        name: profile.full_name,
      })) || [];

    return NextResponse.json({
      users,
      total: users.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, name, phone } = await request.json();

    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: 'Email, password, name, and phone are required' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }

    const adminClient = await createAdminClient();

    const { data: createdUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        phone,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          display_name: name,
          phone: phone,
        },
      });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!createdUser?.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 },
      );
    }

    const userId = createdUser.user.id;

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .upsert(
        {
          auth_id: userId,
          email,
          full_name: name,
          phone,
          role: 'user',
          status: 'active',
        },
        { onConflict: 'auth_id' },
      )
      .select('*')
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile creation failed. Please try again.' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        id: profile.auth_id,
        email: profile.email,
        name: profile.full_name,
        full_name: profile.full_name,
        phone: profile.phone || phone,
        role: profile.role,
        status: profile.status,
        avatar_url: profile.avatar_url || null,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 },
    );
  }
}
