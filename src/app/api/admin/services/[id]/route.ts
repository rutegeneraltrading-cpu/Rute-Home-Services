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
      name,
      description,
      base_price,
      category_id,
      duration_minutes,
      is_active,
    } = body;

    if (!name || !category_id || base_price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('services')
      .update({
        name,
        description: description ?? null,
        base_price: parseFloat(base_price),
        category_id,
        duration_minutes: parseInt(duration_minutes) || 60,
        is_active: is_active !== false,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
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

    const { error: optionsError } = await supabase
      .from('service_options')
      .delete()
      .eq('service_id', id);

    if (optionsError) throw optionsError;

    const { error: serviceError } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (serviceError) throw serviceError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 },
    );
  }
}
