import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/server/email/ses-mailer';
import { resetPasswordChangedTemplate } from '@/lib/server/email';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
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

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update password
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error('Password update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Your password was changed - RUTE Home Services',
          html: resetPasswordChangedTemplate({
            name: user.user_metadata?.full_name || 'User',
            changedAt: new Date().toLocaleString('en-ZA', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
            resetPasswordUrl: `${process.env.NEXT_PUBLIC_APP_URL}/forgot-password`,
          }),
        });
      } catch (emailError) {
        console.error(
          'Reset-password confirmation email send failed:',
          emailError,
        );
      }
    }

    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
