import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET single variant

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ variantId: string }> },
) {
  try {
    const { variantId } = await context.params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('service_option_variants')
      .select('*')
      .eq('id', variantId)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch variant' },
      { status: 500 },
    );
  }
}

// UPDATE variant

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ variantId: string }> },
) {
  try {
    const { variantId } = await context.params;
    const supabase = await createClient();
    const body = await request.json();
    const { data, error } = await supabase
      .from('service_option_variants')
      .update(body)
      .eq('id', variantId)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update variant' },
      { status: 500 },
    );
  }
}

// DELETE variant

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ variantId: string }> },
) {
  try {
    const { variantId } = await context.params;
    const supabase = await createClient();
    const { error } = await supabase
      .from('service_option_variants')
      .delete()
      .eq('id', variantId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete variant' },
      { status: 500 },
    );
  }
}
