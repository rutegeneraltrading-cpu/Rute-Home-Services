import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get all options for a service
    const { data: options, error } = await supabase
      .from('service_options')
      .select('*')
      .eq('service_id', id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error fetching service options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service options' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const {
      name,
      description,
      price,
      duration_minutes,
      is_required,
      display_order,
      platform_fee,
    } = body;

    // Validate required fields
    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Create service option
    const { data: option, error } = await supabase
      .from('service_options')
      .insert([
        {
          service_id: id,
          name,
          description,
          price: parseFloat(price),
          duration_minutes: parseInt(duration_minutes) || 0,
          is_required: is_required || false,
          display_order: display_order || 0,
          is_active: true,
          platform_fee: platform_fee,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(option, { status: 201 });
  } catch (error) {
    console.error('Error creating service option:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'Failed to create service option' },
      { status: 500 },
    );
  }
}
