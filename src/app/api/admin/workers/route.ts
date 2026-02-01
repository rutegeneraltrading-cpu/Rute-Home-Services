import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'worker')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Add default fields for workers if not present
    const workers = (profiles || []).map((w: any) => ({
      ...w,
      service_category: w.service_category || 'General',
      rating: w.rating || 0,
      hourly_rate: w.hourly_rate || 0,
    }));

    return NextResponse.json({
      workers,
      total: workers.length,
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workers' },
      { status: 500 },
    );
  }
}
