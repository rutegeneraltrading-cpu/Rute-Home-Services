import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('services')
      .select(
        `*, category:service_categories(id, name, slug, description, charge_type)`,
      )
      .eq('slug', slug)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json({ service: data });
  } catch (error) {
    console.error('Error fetching service by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service by slug' },
      { status: 500 },
    );
  }
}
