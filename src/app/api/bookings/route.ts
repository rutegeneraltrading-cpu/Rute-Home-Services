import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreateBookingDTO } from '@/lib/types/bookings';

// GET all bookings (user sees own, admin sees all)
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 },
      );
    }

    // Admin sees all bookings, users see only their own
    let query = supabase.from('bookings').select('*');

    if (profile.role !== 'admin') {
      query = query.eq('user_id', profile.id);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ bookings: data });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 },
    );
  }
}

// CREATE new booking
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CreateBookingDTO = await request.json();
    const {
      user_id,
      service_id,
      address,
      booking_date,
      booking_time,
      total_price,
      total_duration,
      selected_options = [],
      selected_variants = [],
      notes,
    } = body;

    // Validate required fields
    if (
      !user_id ||
      !service_id ||
      !address ||
      !booking_date ||
      !booking_time ||
      total_price === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user_id)
      .single();

    if (userError || !user) {
      console.error('Profile not found:', userError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 },
      );
    }
    // Create booking with pending payment status
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          user_id: user.id,
          service_id,
          address,
          booking_date,
          booking_time,
          total_price,
          total_duration,
          selected_options:
            selected_options.length > 0 ? selected_options : null,
          selected_variants:
            selected_variants.length > 0 ? selected_variants : null,
          notes: notes || null,
          status: 'pending',
          payment_status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ booking: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 },
    );
  }
}
