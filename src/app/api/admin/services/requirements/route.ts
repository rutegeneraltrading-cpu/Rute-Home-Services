import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all requirements (with joins for admin)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('service_requirements').select(`
      *,
      service:services (
        id,
        name,
        category:service_categories (
          id,
          name
        )
      )
    `);

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch requirements' },
      { status: 500 },
    );
  }
}

// CREATE requirement
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      service_id,
      name,
      type,
      price,
      duration_minutes,
      is_active,
      display_order,
    } = body;

    if (
      !service_id ||
      !name ||
      !type ||
      price === undefined ||
      duration_minutes === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('service_requirements')
      .insert([
        {
          service_id,
          name,
          type,
          price,
          duration_minutes,
          is_active,
          display_order,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to create requirement' },
      { status: 500 },
    );
  }
}
