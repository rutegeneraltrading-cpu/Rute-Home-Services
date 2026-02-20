import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('id, name, slug, description, image_url, bookings, charge_type')
      .eq('is_active', true);

    if (error) throw error;

    return NextResponse.json({ categories: categories || [] });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service categories' },
      { status: 500 },
    );
  }
}
