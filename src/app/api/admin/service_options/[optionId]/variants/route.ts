import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: List all variants for a service_option

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ optionId: string }> },
) {
  const supabase = await createClient();
  const { optionId } = await context.params;
  const { data, error } = await supabase
    .from('service_option_variants')
    .select('*')
    .eq('service_option_id', optionId)
    .order('display_order', { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST: Create a new variant for a service_option

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ optionId: string }> },
) {
  const supabase = await createClient();
  const { optionId } = await context.params;
  const body = await request.json();
  const { name, type, price, duration_minutes, is_active, display_order } =
    body;
  if (!name || !type) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }
  const { data, error } = await supabase
    .from('service_option_variants')
    .insert([
      {
        service_option_id: optionId,
        name,
        type,
        price: price ?? 0,
        duration_minutes: duration_minutes ?? 0,
        is_active: is_active !== false,
        display_order: display_order ?? 0,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
