import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      service_id,
      name,
      description,
      price,
      duration_minutes,
      is_required,
      display_order,
      is_active,
      type,
      platform_fee,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('service_options')
      .update({
        service_id: service_id || undefined,
        name,
        description: description ?? null,
        price: parseFloat(price),
        duration_minutes: parseInt(duration_minutes) || 0,
        is_required: !!is_required,
        display_order: display_order ?? 0,
        is_active: is_active !== false,
        platform_fee: platform_fee !== undefined ? parseFloat(platform_fee) : 0,
        type,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating service option:', error);
    return NextResponse.json(
      { error: 'Failed to update service option' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from('service_options')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting service option:', error);
    return NextResponse.json(
      { error: 'Failed to delete service option' },
      { status: 500 },
    );
  }
}
