import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    return NextResponse.json({
      categories: categories || [],
      total: (categories || []).length,
    });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service categories' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const { data: category, error } = await supabase
      .from('service_categories')
      .insert({
        name: body.name,
        slug: slug,
        description: body.description || null,
        image_url: body.image_url || null,
        is_active: body.is_active !== false,
        charge_type: body.charge_type ?? 'hourly',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating service category:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to create service category';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
