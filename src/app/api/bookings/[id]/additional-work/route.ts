import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getPayFastService } from '@/lib/server/payfast/payfast.service';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id: bookingId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify booking belongs to this user
    const { data: booking } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', bookingId)
      .eq('user_id', profile.id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { data: additionalWorks, error } = await supabase
      .from('booking_additional_works')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch additional works' },
        { status: 500 },
      );
    }

    return NextResponse.json({ additional_works: additionalWorks || [] });
  } catch (error) {
    console.error('Error fetching additional works:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const { description, fee } = body;

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 },
      );
    }

    const parsedFee = Number(fee);
    if (!parsedFee || parsedFee <= 0 || !Number.isFinite(parsedFee)) {
      return NextResponse.json(
        { error: 'Fee must be a positive number' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('auth_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify booking belongs to user and is in allowed status
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, status, service_id, services(name)')
      .eq('id', bookingId)
      .eq('user_id', profile.id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (!['assigned', 'in_progress'].includes(booking.status)) {
      return NextResponse.json(
        {
          error:
            'Additional work can only be added when booking is assigned or in progress',
        },
        { status: 422 },
      );
    }

    // Create the additional work record
    const { data: additionalWork, error: insertError } = await supabaseAdmin
      .from('booking_additional_works')
      .insert({
        booking_id: bookingId,
        description: description.trim(),
        fee: parsedFee,
        status: 'pending_payment',
      })
      .select()
      .single();

    if (insertError || !additionalWork) {
      console.error('Error inserting additional work:', insertError);
      return NextResponse.json(
        { error: 'Failed to create additional work' },
        { status: 500 },
      );
    }

    // Build PayFast payment URL
    const payfast = getPayFastService();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const fullName = profile.full_name || 'Customer';
    const [firstName, ...lastParts] = fullName.split(' ');
    const lastName = lastParts.join(' ') || 'User';

    const serviceName =
      (Array.isArray(booking.services)
        ? booking.services[0]?.name
        : (booking.services as any)?.name) || 'Service Booking';

    const paymentData = payfast.buildPaymentData(
      additionalWork.id,
      parsedFee,
      firstName || 'Customer',
      lastName,
      profile.email,
      profile.phone || undefined,
      `Additional Work - ${serviceName}`,
      {
        returnUrl: `${appUrl}/success?booking=${bookingId}&additional_work=${additionalWork.id}`,
        cancelUrl: `${appUrl}/cancelled?booking=${bookingId}`,
      },
    );

    const paymentUrl = payfast.generatePaymentUrl(paymentData);

    return NextResponse.json(
      { additional_work: additionalWork, payment_url: paymentUrl },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating additional work:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
