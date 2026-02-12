import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: options, error } = await supabase
      .from('service_options')
      .select('*')
      .eq('service_id', id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ options: options || [] });
  } catch (error) {
    console.error('Error fetching service options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service options' },
      { status: 500 },
    );
  }
}
