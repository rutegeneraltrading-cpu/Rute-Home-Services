import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { CreateBookingDTO } from '@/lib/types/bookings';
// import { sendResendEmail } from '@/lib/server/email';
// import { bookingCreatedTemplate } from '@/lib/server/email';

// const MAX_TITLE_LENGTH = 70;

// function buildBookingServiceSubject(
//   serviceName: string,
//   serviceCategory?: string,
// ): string {
//   const fullName = serviceCategory
//     ? `${serviceName} - ${serviceCategory}`
//     : serviceName;
//   return fullName.length > MAX_TITLE_LENGTH
//     ? fullName.substring(0, MAX_TITLE_LENGTH - 3) + '...'
//     : fullName;
// }

// GET all bookings (user sees own, admin sees all)
export async function GET() {
  try {
    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role
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

    // Admin sees all bookings, users see only their own
    let query = supabaseAdmin.from('bookings').select('*');

    if (profile.role !== 'admin') {
      query = query.eq('user_id', profile.id);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) throw error;

    const bookings = data || [];
    const bookingIds = Array.from(
      new Set(bookings.map((b) => b.id).filter(Boolean)),
    );
    const userIds = Array.from(
      new Set(bookings.map((b) => b.user_id).filter(Boolean)),
    );
    const serviceIds = Array.from(
      new Set(bookings.map((b) => b.service_id).filter(Boolean)),
    );

    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    const { data: servicesData, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('id, name, category_id')
      .in('id', serviceIds);

    if (servicesError) throw servicesError;

    const categoryIds = Array.from(
      new Set((servicesData || []).map((s) => s.category_id).filter(Boolean)),
    );

    const { data: categoriesData, error: categoriesError } = await supabaseAdmin
      .from('service_categories')
      .select('id, name')
      .in('id', categoryIds);

    if (categoriesError) throw categoriesError;

    const { data: assignmentsData, error: assignmentsError } =
      await supabaseAdmin
        .from('booking_assignments')
        .select(
          'booking_id, worker_id, status, assigned_at, accepted_at, declined_at, completed_at, cancelled_at, created_at',
        )
        .in('booking_id', bookingIds)
        .order('assigned_at', { ascending: false });

    if (assignmentsError) throw assignmentsError;

    const latestAssignmentByBooking = new Map<
      string,
      {
        worker_id: string;
        status: string;
        assigned_at: string | null;
        accepted_at: string | null;
        declined_at: string | null;
        completed_at: string | null;
        cancelled_at: string | null;
        created_at: string | null;
      }
    >();

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

    (assignmentsData || []).forEach((assignment) => {
      const existing = latestAssignmentByBooking.get(assignment.booking_id);
      if (!existing) {
        latestAssignmentByBooking.set(assignment.booking_id, assignment);
        return;
      }

      const existingTime = assignmentEventTime(existing);
      const nextTime = assignmentEventTime(assignment);

      if (nextTime > existingTime) {
        latestAssignmentByBooking.set(assignment.booking_id, assignment);
      }
    });

    // Collect all unique worker_ids from all assignments, not just latest
    const workerIds = Array.from(
      new Set((assignmentsData || []).map((a) => a.worker_id).filter(Boolean)),
    );

    const { data: workersData, error: workersError } = await supabaseAdmin
      .from('workers')
      .select('id, profile_id')
      .in('id', workerIds);

    if (workersError) throw workersError;

    const workerProfileIds = Array.from(
      new Set((workersData || []).map((w) => w.profile_id).filter(Boolean)),
    );

    const { data: workerProfilesData, error: workerProfilesError } =
      await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', workerProfileIds);

    if (workerProfilesError) throw workerProfilesError;

    const profilesMap = new Map(
      (profilesData || []).map((p) => [
        p.id,
        { full_name: p.full_name, email: p.email },
      ]),
    );

    const categoriesMap = new Map(
      (categoriesData || []).map((c) => [c.id, c.name]),
    );

    const servicesMap = new Map(
      (servicesData || []).map((s) => [
        s.id,
        {
          name: s.name,
          category: s.category_id ? categoriesMap.get(s.category_id) : null,
        },
      ]),
    );

    const workerMap = new Map(
      (workersData || []).map((w) => [w.id, w.profile_id]),
    );
    const workerProfileMap = new Map(
      (workerProfilesData || []).map((p) => [p.id, p]),
    );

    // Build a map of all assignments per booking
    const assignmentsByBooking: Record<string, any[]> = {};
    (assignmentsData || []).forEach((a) => {
      if (!assignmentsByBooking[a.booking_id])
        assignmentsByBooking[a.booking_id] = [];
      // Find worker profile info
      const workerProfileId = workerMap.get(a.worker_id);
      const workerProfile = workerProfileId
        ? workerProfileMap.get(workerProfileId)
        : null;
      assignmentsByBooking[a.booking_id].push({
        worker_id: a.worker_id,
        worker_name: workerProfile?.full_name || null,
        worker_email: workerProfile?.email || null,
        status: a.status,
        assigned_at: a.assigned_at,
        accepted_at: a.accepted_at,
        declined_at: a.declined_at,
        completed_at: a.completed_at,
        cancelled_at: a.cancelled_at,
        created_at: a.created_at,
      });
    });

    const enrichedBookings = bookings.map((booking) => {
      const customer = profilesMap.get(booking.user_id);
      const service = servicesMap.get(booking.service_id);
      const assignment = latestAssignmentByBooking.get(booking.id);
      const workerProfileId = assignment?.worker_id
        ? workerMap.get(assignment.worker_id)
        : null;
      const assignedWorker = workerProfileId
        ? workerProfileMap.get(workerProfileId)
        : null;

      return {
        ...booking,
        customer_name: customer?.full_name || null,
        customer_email: customer?.email || null,
        service_name: service?.name || null,
        service_category: service?.category || null,
        assigned_worker_id: assignment?.worker_id || null,
        assigned_worker_name: assignedWorker?.full_name || null,
        assigned_worker_email: assignedWorker?.email || null,
        assignment_status: assignment?.status || null,
        assignments: assignmentsByBooking[booking.id] || [],
      };
    });

    return NextResponse.json({ bookings: enrichedBookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 },
    );
  }
}

// CREATE new booking
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CreateBookingDTO = await request.json();
    const {
      user_id,
      service_id,
      address,
      unit_or_flat,
      booking_date,
      booking_time,
      total_price,
      total_duration,
      selected_options = [],
      selected_variants = [],
      notes,
      priority_status,
      priority_fee,
      app_fee,
      insurance,
    } = body;

    // Validate required fields
    if (
      !user_id ||
      !service_id ||
      !address ||
      !booking_date ||
      !booking_time ||
      total_price === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('auth_id', user_id)
      .single();

    if (userError || !user) {
      console.error('Profile not found:', userError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 },
      );
    }
    // Create booking with pending payment status
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          user_id: user.id,
          service_id,
          address,
          unit_or_flat: unit_or_flat?.trim() || null,
          booking_date,
          booking_time,
          total_price,
          total_duration,
          selected_options:
            selected_options.length > 0 ? selected_options : null,
          selected_variants:
            selected_variants.length > 0 ? selected_variants : null,
          notes: notes || null,
          status: 'pending',
          payment_status: 'pending',
          priority_status,
          priority_fee: priority_fee || null,
          app_fee: app_fee || null,
          insurance: insurance ?? false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const { data: serviceData } = await supabase
      .from('services')
      .select('id, name, category_id')
      .eq('id', service_id)
      .maybeSingle();

    const serviceDetails: {
      name: string;
      category?: string;
      options?: Array<{
        name: string;
        description: string | null;
        price: number;
      }>;
      requirements?: Array<{
        name: string;
        type: string;
        price: number;
      }>;
    } = {
      name: serviceData?.name || 'Service',
    };

    if (serviceData?.category_id) {
      const { data: categoryData } = await supabase
        .from('service_categories')
        .select('name')
        .eq('id', serviceData.category_id)
        .maybeSingle();
      serviceDetails.category = categoryData?.name;
    }

    // Fetch selected options details
    if (selected_options.length > 0) {
      const { data: optionsData } = await supabase
        .from('service_options')
        .select('id, name, description, price')
        .in('id', selected_options);

      serviceDetails.options = (optionsData || []).map((opt) => ({
        name: opt.name,
        description: opt.description,
        price: opt.price,
      }));
    }

    // Fetch selected requirements details
    if (selected_variants.length > 0) {
      const { data: variantsData } = await supabase
        .from('service_requirements')
        .select('id, name, type, price')
        .in('id', selected_variants);

      serviceDetails.requirements = (variantsData || []).map((v) => ({
        name: v.name,
        type: v.type,
        price: v.price,
      }));
    }

    // Keeps derived details available for quick re-enable of email workflow.
    void serviceDetails;

    // Email sending is temporarily disabled for booking creation.
    // if (user.email) {
    //   try {
    //     const serviceSubject = buildBookingServiceSubject(
    //       serviceDetails.name,
    //       serviceDetails.category,
    //     );

    //     await sendResendEmail({
    //       to: user.email,
    //       subject: `Booking Created - ${serviceSubject}`,
    //       html: bookingCreatedTemplate({
    //         customerName: user.full_name || 'Customer',
    //         bookingId: data.id,
    //         service: serviceDetails,
    //         address: String(address || ''),
    //         unitOrFlat: unit_or_flat?.trim() || undefined,
    //         notes: notes?.trim() || undefined,
    //         bookingDate: String(booking_date),
    //         bookingTime: String(booking_time),
    //         total: Number(total_price),
    //         paymentStatus: 'Pending',
    //         detailsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${data.id}`,
    //       }),
    //     });
    //   } catch (emailError) {
    //     console.error('Booking created email send failed:', emailError);
    //   }
    // }

    return NextResponse.json({ booking: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 },
    );
  }
}
