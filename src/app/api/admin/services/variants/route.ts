import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/server/requireAdmin';

// GET all requirements (legacy variants endpoint kept for backward compatibility)
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

// CREATE requirement (accepts both service_id and legacy service_option_id)
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const supabase = await createClient();
    const body = await request.json();

    let serviceId: string | undefined = body.service_id;

    // Legacy support: map service_option_id -> service_id
    if (!serviceId && body.service_option_id) {
      const { data: optionRow, error: optionError } = await supabase
        .from('service_options')
        .select('service_id')
        .eq('id', body.service_option_id)
        .single();

      if (optionError) {
        return NextResponse.json(
          { error: 'Invalid service option id' },
          { status: 400 },
        );
      }

      serviceId = optionRow?.service_id;
    }

    const { name, type, price, duration_minutes, is_active, display_order } =
      body;

    if (
      !serviceId ||
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
          service_id: serviceId,
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
