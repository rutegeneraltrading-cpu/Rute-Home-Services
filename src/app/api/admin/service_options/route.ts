import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: options, error } = await supabase
      .from('service_options')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) throw error;
    return NextResponse.json(options);
  } catch (error) {
    console.error('Error fetching all service options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch all service options' },
      { status: 500 },
    );
  }
}
