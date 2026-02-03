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
        ),
        worker_services:worker_services (
          service_id,
          service:services (
            name,
            service_categories:category_id (
              name
            )
          )
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (workersError) throw workersError;

    // Flatten the response
    const formattedWorkers = (workers || []).map((w: any) => {
      const workerServices = w.worker_services || [];
      const serviceNames = workerServices
        .map((ws: any) => ws?.service?.name)
        .filter(Boolean);
      const categoryNames = workerServices
        .map((ws: any) => ws?.service?.service_categories?.name)
        .filter(Boolean);
      const serviceIds = workerServices
        .map((ws: any) => ws?.service_id)
        .filter(Boolean);

      return {
        ...w,
        ...w.profiles,
        service_names: Array.from(new Set(serviceNames)),
        service_category_names: Array.from(new Set(categoryNames)),
        service_ids: Array.from(new Set(serviceIds)),
        profiles: undefined,
        worker_services: undefined,
      };
    });

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
