import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface AvailabilitySlotsResult {
  available_slots: string[];
  available_workers_count: number;
  duration_minutes: number;
  message?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get('service_id');
    const bookingDate = searchParams.get('date');
    const durationRaw = searchParams.get('duration_minutes');
    const workerId = searchParams.get('worker_id'); // optional: filter by specific worker

    if (!serviceId || !bookingDate || !durationRaw) {
      return NextResponse.json(
        { error: 'service_id, date and duration_minutes are required' },
        { status: 400 },
      );
    }

    const durationMinutes = Number(durationRaw);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return NextResponse.json(
        { error: 'duration_minutes must be a positive number' },
        { status: 400 },
      );
    }

    const supabase = await createAdminClient();

    // Call Supabase function to get available slots (all workers)
    const { data, error } = await supabase.rpc(
      'get_available_slots_for_service',
      {
        p_service_id: serviceId,
        p_booking_date: bookingDate,
        p_duration_minutes: durationMinutes,
      },
    );

    if (error) {
      console.error('Supabase function error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch available slots' },
        { status: 500 },
      );
    }

    // Parse the JSON result from the function
    const result: AvailabilitySlotsResult =
      (data as AvailabilitySlotsResult) || {
        available_slots: [],
        available_workers_count: 0,
        duration_minutes: durationMinutes,
        message: 'No data returned',
      };

    // If a specific worker_id is provided, filter slots to only those where
    // that worker is available
    if (workerId && result.available_slots.length > 0) {
      const slotChecks = await Promise.all(
        result.available_slots.map(async (slot) => {
          const { data: workers } = await supabase.rpc(
            'get_available_workers_for_booking',
            {
              p_service_id: serviceId,
              p_booking_date: bookingDate,
              p_booking_time: slot,
              p_duration_minutes: durationMinutes,
            },
          );
          const availableWorkers =
            (workers as Array<{ worker_id: string }>) || [];
          const isAvailable = availableWorkers.some(
            (w) => w.worker_id === workerId,
          );
          return { slot, isAvailable };
        }),
      );

      result.available_slots = slotChecks
        .filter((c) => c.isAvailable)
        .map((c) => c.slot);
      result.available_workers_count =
        result.available_slots.length > 0 ? 1 : 0;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Workers availability error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
