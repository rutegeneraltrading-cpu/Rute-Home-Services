import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/server/email/ses-mailer';
import { signinAlertTemplate } from '@/lib/server/email';

function isAuthAlertEnabled() {
  const value = (process.env.EMAIL_AUTH_ALERTS_ENABLED || 'true')
    .trim()
    .toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

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

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = await createClient();

    // Sign in
    const { error, data } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error:
            'Please verify your email before signing in. Check your inbox and spam folder.',
        },
        { status: 401 },
      );
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
    if (userData.status === 'suspended') {
      // Sign out the user
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 401 },
      );
    }
    if (userData.status === 'inactive') {
      // Sign out the user
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Your account is inactive. Please contact support.' },
        { status: 401 },
      );
    }

    const userAgent = request.headers.get('user-agent') || 'Unknown device';
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const ipAddress = forwardedFor.split(',')[0]?.trim() || 'Unknown IP';
    const currentFingerprint = createHash('sha256')
      .update(`${userAgent}|${ipAddress}`)
      .digest('hex');
    const previousFingerprint =
      data.user.user_metadata?.last_login_fingerprint || null;

    const shouldSendSigninAlert =
      isAuthAlertEnabled() &&
      Boolean(userData.email) &&
      previousFingerprint !== currentFingerprint;

    if (shouldSendSigninAlert) {
      try {
        await sendEmail({
          to: userData.email,
          subject: 'New sign-in alert - RUTE Home Services',
          html: signinAlertTemplate({
            name: userData.full_name || 'User',
            loginTime: new Date().toLocaleString('en-ZA', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
            device: userAgent,
            ipAddress,
            resetPasswordUrl: `${process.env.NEXT_PUBLIC_APP_URL}/forgot-password`,
          }),
        });
      } catch (emailError) {
        console.error('Login alert email send failed:', emailError);
      }
    }

    try {
      const existingMetadata = data.user.user_metadata || {};
      await supabase.auth.updateUser({
        data: {
          ...existingMetadata,
          last_login_fingerprint: currentFingerprint,
          last_login_ip: ipAddress,
          last_login_at: new Date().toISOString(),
        },
      });
    } catch (metadataError) {
      console.error('Failed to update login metadata:', metadataError);
    }

    return NextResponse.json({
      user: {
        id: userData.auth_id,
        email: userData.email,
        name: userData.full_name,
        phone: userData.phone,
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
