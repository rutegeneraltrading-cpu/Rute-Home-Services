import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/server/requireAdmin';

// GET single requirement (legacy variants endpoint)

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ variantId: string }> },
) {
  try {
    const { variantId } = await context.params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('service_requirements')
      .select('*')
      .eq('id', variantId)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch requirement' },
      { status: 500 },
    );
  }
}

// UPDATE requirement

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ variantId: string }> },
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { variantId } = await context.params;
    const supabase = await createClient();
    const body = await request.json();
    const { data, error } = await supabase
      .from('service_requirements')
      .update(body)
      .eq('id', variantId)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update requirement' },
      { status: 500 },
    );
  }
}

// DELETE requirement

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ variantId: string }> },
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { variantId } = await context.params;
    const supabase = await createClient();
    const { error } = await supabase
      .from('service_requirements')
      .delete()
      .eq('id', variantId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete requirement' },
      { status: 500 },
    );
  }
}
