import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all active services with their categories
    const { data: services, error } = await supabase
      .from('services')
      .select(
        `
        *,
        category:service_categories(id, name, slug)
      `,
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const {
      name,
      slug,
      description,
      base_price,
      category_id,
      duration_minutes,
    } = body;

    // Validate required fields
    if (!name || !slug || !category_id || base_price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Create service
    const { data: service, error } = await supabase
      .from('services')
      .insert([
        {
          name,
          slug,
          description,
          base_price: parseFloat(base_price),
          category_id,
          duration_minutes: parseInt(duration_minutes) || 60,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 },
    );
  }
}
