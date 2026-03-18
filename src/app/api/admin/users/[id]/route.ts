import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
// import { sendEmail } from '@/lib/server/email/ses-mailer';
// import { userStatusChangeTemplate } from '@/lib/server/email';

/**
 * GET /api/admin/users/[id]
 * Get a single user by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        'auth_id, full_name, email, avatar_url, role, status, created_at, updated_at',
      )
      .eq('auth_id', id)
      .single();

    if (error) throw error;

    // Map auth_id to id for consistency with User type
    const user = {
      ...profile,
      id: profile.auth_id,
      name: profile.full_name,
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user profile
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { full_name, status } = body;

    const supabase = await createAdminClient();

    // const { data: existingProfile } = await supabase
    //   .from('profiles')
    //   .select('email, full_name, status')
    //   .eq('auth_id', id)
    //   .maybeSingle();

    // Update profile - full_name, and status
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_id', id)
      .select()
      .single();

    if (error) throw error;

    // if (existingProfile?.email && status && existingProfile.status !== status) {
    //   try {
    //     await sendEmail({
    //       to: existingProfile.email,
    //       subject: 'Your account status has been updated',
    //       html: userStatusChangeTemplate({
    //         fullName: existingProfile.full_name || full_name || 'User',
    //         email: existingProfile.email,
    //         status,
    //         changedAt: new Date().toLocaleString('en-ZA', {
    //           dateStyle: 'medium',
    //           timeStyle: 'short',
    //         }),
    //       }),
    //     });
    //   } catch (emailError) {
    //     console.error('User status change email send failed:', emailError);
    //   }
    // }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user from both auth and profiles table
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    // First, delete from profiles table (cascade will handle related data)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('auth_id', id);

    if (profileError) throw profileError;

    // Then, delete from auth (admin API)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
      // Don't throw - profile is already deleted
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 },
    );
  }
}
