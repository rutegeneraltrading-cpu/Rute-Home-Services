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

    // Call Supabase function to get available slots
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
    const result = (data as AvailabilitySlotsResult) || {
      available_slots: [],
      available_workers_count: 0,
      duration_minutes: durationMinutes,
      message: 'No data returned',
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Workers availability error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
