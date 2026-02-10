import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileId = profile.id || profile.auth_id || user.id;

    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .in('profile_id', [profileId, user.id])
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch addresses' },
        { status: 400 },
      );
    }

    return NextResponse.json({ addresses: data || [] });
  } catch (error) {
    console.error('User addresses GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      label,
      recipient_name,
      phone,
      line1,
      line2,
      city,
      state_province,
      postal_code,
      country,
      is_primary,
    } = body;

    if (!line1 || !city || !state_province || !postal_code || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileId = profile.id || profile.auth_id || user.id;

    let shouldBePrimary = Boolean(is_primary);

    const { data: existingPrimary, error: primaryError } = await supabase
      .from('user_addresses')
      .select('id')
      .eq('profile_id', profileId)
      .eq('is_primary', true)
      .maybeSingle();

    if (primaryError) {
      return NextResponse.json(
        { error: 'Failed to validate primary address' },
        { status: 400 },
      );
    }

    if (!existingPrimary && !shouldBePrimary) {
      shouldBePrimary = true;
    }

    if (shouldBePrimary) {
      const { error: resetError } = await supabase
        .from('user_addresses')
        .update({ is_primary: false })
        .eq('profile_id', profileId);

      if (resetError) {
        return NextResponse.json(
          { error: 'Failed to reset primary address' },
          { status: 400 },
        );
      }
    }

    const { data: address, error } = await supabase
      .from('user_addresses')
      .insert({
        profile_id: profileId,
        label: label || 'home',
        recipient_name: recipient_name || null,
        phone: phone || null,
        line1,
        line2: line2 || null,
        city,
        state_province,
        postal_code,
        country,
        is_primary: shouldBePrimary,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: 'Failed to create address',
          details: error.message,
        },
        { status: 400 },
      );
    }

    if (shouldBePrimary) {
      await supabase
        .from('profiles')
        .update({ phone: phone || null })
        .eq('auth_id', user.id);
    }

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error('User addresses POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
