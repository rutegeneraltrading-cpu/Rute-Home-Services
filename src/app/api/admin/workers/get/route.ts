import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Get all workers with their profile data
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select(
        `
        id,
        profile_id,
        phone,
        rating_avg,
        is_active,
        created_at,
        profiles:profile_id (
          id,
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
    const profileIds = (workers || [])
      .map((w: any) => w?.profiles?.id)
      .filter(Boolean);

    const { data: addresses } = await supabase
      .from('user_addresses')
      .select('*')
      .in('profile_id', profileIds)
      .eq('is_primary', true);

    const addressMap = new Map(
      (addresses || []).map((addr: any) => [addr.profile_id, addr]),
    );

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
        ...w.profiles,
        ...w,
        primary_address: addressMap.get(w?.profiles?.id) || null,
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
