import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all workers with their profile data
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select(
        `
        id,
        profile_id,
        phone,
        address,
        rating_avg,
        hourly_rate,
        is_active,
        created_at,
        profiles:profile_id (
          auth_id,
          full_name,
          email,
          avatar_url,
          role,
          status
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (workersError) throw workersError;

    // Flatten the response
    const formattedWorkers = (workers || []).map((w: any) => ({
      ...w,
      ...w.profiles,
      profiles: undefined,
    }));

    return NextResponse.json({
      workers: formattedWorkers,
      total: formattedWorkers.length,
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workers' },
      { status: 500 },
    );
  }
}
