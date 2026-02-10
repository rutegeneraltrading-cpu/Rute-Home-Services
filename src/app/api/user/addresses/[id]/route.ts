import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileId = profile.id || profile.auth_id || user.id;
    const body = await request.json();

    const { data: existing, error: existingError } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('id', id)
      .in('profile_id', [profileId, user.id])
      .single();

    if (existingError) {
      return NextResponse.json(
        { error: 'Failed to load address', details: existingError.message },
        { status: 400 },
      );
    }

    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const updateData: Record<string, string | boolean | null> = {};
    const updatableFields = [
      'label',
      'recipient_name',
      'phone',
      'line1',
      'line2',
      'city',
      'state_province',
      'postal_code',
      'country',
      'is_primary',
    ];

    updatableFields.forEach((field) => {
      if (field in body) {
        updateData[field] = body[field] ?? null;
      }
    });

    const nextIsPrimary =
      typeof updateData.is_primary === 'boolean'
        ? (updateData.is_primary as boolean)
        : existing.is_primary;

    if (nextIsPrimary) {
      const { error: resetError } = await supabase
        .from('user_addresses')
        .update({ is_primary: false })
        .in('profile_id', [profileId, user.id])
        .neq('id', id);

      if (resetError) {
        return NextResponse.json(
          { error: 'Failed to reset primary address' },
          { status: 400 },
        );
      }
    }

    const { data: updated, error } = await supabase
      .from('user_addresses')
      .update({ ...updateData, updated_at: new Date() })
      .eq('id', id)
      .in('profile_id', [profileId, user.id])
      .select('*')
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: 'Failed to update address' },
        { status: 400 },
      );
    }

    if (nextIsPrimary) {
      await supabase
        .from('profiles')
        .update({ phone: updated.phone || null })
        .eq('auth_id', user.id);
    } else if (existing.is_primary && !nextIsPrimary) {
      const { data: fallback } = await supabase
        .from('user_addresses')
        .select('*')
        .in('profile_id', [profileId, user.id])
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallback) {
        await supabase
          .from('user_addresses')
          .update({ is_primary: true })
          .eq('id', fallback.id)
          .in('profile_id', [profileId, user.id]);

        await supabase
          .from('profiles')
          .update({ phone: fallback.phone || null })
          .eq('auth_id', user.id);
      } else {
        await supabase
          .from('profiles')
          .update({ phone: null })
          .eq('auth_id', user.id);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('User address PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileId = profile.id || profile.auth_id || user.id;

    const { data: existing, error: existingError } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('id', id)
      .in('profile_id', [profileId, user.id])
      .single();

    if (existingError) {
      return NextResponse.json(
        { error: 'Failed to load address', details: existingError.message },
        { status: 400 },
      );
    }

    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id)
      .in('profile_id', [profileId, user.id]);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete address' },
        { status: 400 },
      );
    }

    if (existing.is_primary) {
      const { data: fallback } = await supabase
        .from('user_addresses')
        .select('*')
        .in('profile_id', [profileId, user.id])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallback) {
        await supabase
          .from('user_addresses')
          .update({ is_primary: true })
          .eq('id', fallback.id)
          .in('profile_id', [profileId, user.id]);

        await supabase
          .from('profiles')
          .update({ phone: fallback.phone || null })
          .eq('auth_id', user.id);
      } else {
        await supabase
          .from('profiles')
          .update({ phone: null })
          .eq('auth_id', user.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User address DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
