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

    const { name, description, image_url, bookings, charge_type } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('service_categories')
      .update({
        name,
        description: description ?? null,
        image_url: image_url ?? null,
        bookings: bookings ?? 0,
        charge_type: charge_type ?? 'hourly',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating service category:', error);
    return NextResponse.json(
      { error: 'Failed to update service category' },
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

    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .eq('category_id', id);

    if (servicesError) throw servicesError;

    const serviceIds = (services || []).map((service) => service.id);

    if (serviceIds.length > 0) {
      const { error: optionsError } = await supabase
        .from('service_options')
        .delete()
        .in('service_id', serviceIds);

      if (optionsError) throw optionsError;
    }

    const { error: deleteServicesError } = await supabase
      .from('services')
      .delete()
      .eq('category_id', id);

    if (deleteServicesError) throw deleteServicesError;

    const { error: categoryError } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', id);

    if (categoryError) throw categoryError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting service category:', error);
    return NextResponse.json(
      { error: 'Failed to delete service category' },
      { status: 500 },
    );
  }
}
