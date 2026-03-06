import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET variants for specific service option IDs (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const optionIds = searchParams.get('option_ids');

    if (!optionIds) {
      return NextResponse.json(
        { error: 'option_ids parameter is required' },
        { status: 400 },
      );
    }

    const optionIdsArray = optionIds.split(',').filter(Boolean);

    if (optionIdsArray.length === 0) {
      return NextResponse.json({ variants: [] });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('service_option_variants')
      .select('*')
      .in('service_option_id', optionIdsArray)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ variants: data || [] });
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variants' },
      { status: 500 },
    );
  }
}
