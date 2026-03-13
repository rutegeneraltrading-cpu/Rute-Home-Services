import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET single requirement
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ requirementId: string }> },
) {
  try {
    const { requirementId } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('service_requirements')
      .select('*')
      .eq('id', requirementId)
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
  context: { params: Promise<{ requirementId: string }> },
) {
  try {
    const { requirementId } = await context.params;
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('service_requirements')
      .update(body)
      .eq('id', requirementId)
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
  context: { params: Promise<{ requirementId: string }> },
) {
  try {
    const { requirementId } = await context.params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('service_requirements')
      .delete()
      .eq('id', requirementId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete requirement' },
      { status: 500 },
    );
  }
}
