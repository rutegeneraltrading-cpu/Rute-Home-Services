import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase';

const normalizeToE164 = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  const digitsOnly = raw.replace(/\D/g, '');
  return `+${digitsOnly}`;
};

const isE164Phone = (value: string): boolean => /^\+[1-9]\d{7,14}$/.test(value);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone } = await request.json();

    // 1. VALIDATE INPUT
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

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizeToE164(phone);

    if (!isE164Phone(normalizedPhone)) {
      return NextResponse.json(
        {
          error:
            'Invalid phone number format. Use international format (E.164), e.g. +27821234567',
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // 2. SIGN UP USER WITH SUPABASE AUTH
    const { error: authError, data: authData } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/user?verified=1`,
        data: {
          full_name: name,
          phone: normalizedPhone,
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

    const adminClient = await createAdminClient();

    // Ensure phone is stored in Supabase auth.users (top-level phone field)
    const { error: authUpdateError } =
      await adminClient.auth.admin.updateUserById(authData.user.id, {
        phone: normalizedPhone,
        user_metadata: {
          ...(authData.user.user_metadata || {}),
          full_name: name,
          phone: normalizedPhone,
        },
      });

    if (authUpdateError) {
      console.error('Auth phone update error:', authUpdateError);
    }

    // 3. WAIT FOR TRIGGER TO CREATE PROFILE
    // Supabase trigger automatically creates profile on auth user creation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 4. UPDATE PROFILE WITH PHONE AND FETCH (using admin client to bypass RLS)
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .update({ phone: normalizedPhone })
      .eq('auth_id', authData.user.id)
      .select('*')
      .single();

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json(
        { error: 'Profile update failed. Please try again.' },
        { status: 400 },
      );
    }

    // 5. RETURN USER DATA
    const requiresEmailVerification =
      !authData.session || !authData.user.email_confirmed_at;

    return NextResponse.json(
      {
        requires_email_verification: requiresEmailVerification,
        message: requiresEmailVerification
          ? 'Account created. Please verify your email before signing in.'
          : 'Account created successfully.',
        user: {
          id: profile.auth_id,
          email: profile.email,
          name: profile.full_name,
          phone: normalizedPhone,
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
