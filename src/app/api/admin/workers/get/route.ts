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
            base_price,
            service_categories:category_id (
              name,
              charge_type
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

      // Unique category details: { name, charge_type }
      const categoryDetailsMap = new Map();
      workerServices.forEach((ws: any) => {
        const cat = ws?.service?.service_categories;
        if (cat?.name) {
          categoryDetailsMap.set(cat.name, {
            name: cat.name,
            charge_type: cat.charge_type,
          });
        }
      });
      const service_category_details = Array.from(categoryDetailsMap.values());

      // Service details: { name, base_price, category_name, charge_type }
      const serviceDetails = workerServices
        .map((ws: any) => {
          const name = ws?.service?.name;
          const base_price = ws?.service?.base_price;
          const cat = ws?.service?.service_categories;
          if (
            name &&
            cat?.name &&
            cat?.charge_type !== undefined &&
            base_price !== undefined
          ) {
            return {
              name,
              base_price,
              category_name: cat.name,
              charge_type: cat.charge_type,
            };
          }
          return null;
        })
        .filter(Boolean);

      return {
        ...w.profiles,
        ...w,
        primary_address: addressMap.get(w?.profiles?.id) || null,
        service_names: Array.from(new Set(serviceNames)),
        service_category_names: Array.from(new Set(categoryNames)),
        service_ids: Array.from(new Set(serviceIds)),
        service_category_details,
        service_details: serviceDetails,
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
