import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 },
      );
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, service_id, booking_date, booking_time, total_duration')
      .eq('id', id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { data: workers, error: workersError } = await supabaseAdmin.rpc(
      'get_available_workers_for_booking',
      {
        p_service_id: booking.service_id,
        p_booking_date: booking.booking_date,
        p_booking_time: booking.booking_time,
        p_duration_minutes: booking.total_duration,
      },
    );

    if (workersError) {
      return NextResponse.json(
        { error: workersError.message || 'Failed to fetch available workers' },
        { status: 500 },
      );
    }

    const { data: assignmentRows } = await supabaseAdmin
      .from('booking_assignments')
      .select(
        'worker_id, status, assigned_at, accepted_at, declined_at, completed_at, cancelled_at, created_at',
      )
      .eq('booking_id', id);

    const assignmentEventTime = (assignment: {
      assigned_at: string | null;
      accepted_at: string | null;
      declined_at: string | null;
      completed_at: string | null;
      cancelled_at: string | null;
      created_at: string | null;
    }) => {
      const ts = [
        assignment.cancelled_at,
        assignment.completed_at,
        assignment.declined_at,
        assignment.accepted_at,
        assignment.assigned_at,
        assignment.created_at,
      ]
        .filter(Boolean)
        .map((value) => new Date(String(value)).getTime());

      return ts.length ? Math.max(...ts) : 0;
    };

    const latestAssignment = (assignmentRows || []).reduce<{
      worker_id: string;
      status: string;
      assigned_at: string | null;
      accepted_at: string | null;
      declined_at: string | null;
      completed_at: string | null;
      cancelled_at: string | null;
      created_at: string | null;
    } | null>((latest, current) => {
      if (!latest) return current;
      return assignmentEventTime(current) > assignmentEventTime(latest)
        ? current
        : latest;
    }, null);

    let workersList = (workers || []) as Array<{
      worker_id: string;
      profile_id: string;
      full_name: string;
      phone: string | null;
      rating_avg: number | null;
    }>;

    const assignedWorkerId = latestAssignment?.worker_id || null;
    if (
      assignedWorkerId &&
      !workersList.some((worker) => worker.worker_id === assignedWorkerId)
    ) {
      const { data: assignedWorkerRow } = await supabaseAdmin
        .from('workers')
        .select('id, profile_id, phone, rating_avg')
        .eq('id', assignedWorkerId)
        .single();

      if (assignedWorkerRow) {
        const { data: assignedProfileRow } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', assignedWorkerRow.profile_id)
          .single();

        workersList = [
          {
            worker_id: assignedWorkerRow.id,
            profile_id: assignedWorkerRow.profile_id,
            full_name: assignedProfileRow?.full_name || 'Assigned Worker',
            phone: assignedWorkerRow.phone,
            rating_avg: assignedWorkerRow.rating_avg,
          },
          ...workersList,
        ];
      }
    }

    return NextResponse.json({
      workers: workersList,
      assigned_worker_id: assignedWorkerId,
      assignment_status: latestAssignment?.status || null,
    });
  } catch (error) {
    console.error('Available workers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
