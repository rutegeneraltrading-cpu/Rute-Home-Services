import { NextResponse, NextRequest } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const workerId = id;

    // Get worker from workers table first
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .single();

    if (workerError) throw workerError;
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', worker.profile_id)
      .single();

    if (profileError) throw profileError;

    return NextResponse.json({
      worker: {
        ...worker,
        ...profile,
      },
    });
  } catch (error) {
    console.error('Error fetching worker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worker' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const workerId = id;
    const body = await request.json();

    // Get worker to find profile_id
    const { data: worker } = await supabase
      .from('workers')
      .select('profile_id')
      .eq('id', workerId)
      .single();

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Extract profile fields and status
    const { full_name, email, avatar_url, status, ...workerFields } = body;

    // Update profile if provided
    if (full_name || email || avatar_url !== undefined) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...(full_name && { full_name }),
          ...(email && { email }),
          ...(avatar_url !== undefined && { avatar_url }),
          ...(status && { status }),
        })
        .eq('auth_id', worker.profile_id);

      if (profileError) throw profileError;
    } else if (status) {
      // If only status is being updated
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status })
        .eq('auth_id', worker.profile_id);

      if (profileError) throw profileError;
    }

    // Update worker fields
    const { data: updatedWorker, error: workerUpdateError } = await supabase
      .from('workers')
      .update(workerFields)
      .eq('id', workerId)
      .select()
      .single();

    if (workerUpdateError) throw workerUpdateError;

    // Get updated profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', worker.profile_id)
      .single();

    return NextResponse.json({
      worker: {
        ...updatedWorker,
        ...profile,
      },
    });
  } catch (error) {
    console.error('Error updating worker:', error);
    return NextResponse.json(
      { error: 'Failed to update worker' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const workerId = id;
    const { action } = await request.json();

    // Get worker to find profile_id
    const { data: worker } = await supabase
      .from('workers')
      .select('profile_id')
      .eq('id', workerId)
      .single();

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Suspend/Unsuspend worker by updating profile status
    let newStatus = 'active';
    if (action === 'suspend') {
      newStatus = 'suspended';
    } else if (action === 'unsuspend') {
      newStatus = 'active';
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('auth_id', worker.profile_id)
      .select()
      .single();

    if (profileError) throw profileError;

    // Get updated worker
    const { data: updatedWorker } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .single();

    return NextResponse.json({
      worker: {
        ...updatedWorker,
        ...profile,
      },
    });
  } catch (error) {
    console.error('Error updating worker status:', error);
    return NextResponse.json(
      { error: 'Failed to update worker status' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // Get worker to find profile_id
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, profile_id')
      .eq('id', id)
      .single();

    if (workerError) throw workerError;
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Delete worker_services first
    const { error: workerServicesError } = await supabase
      .from('worker_services')
      .delete()
      .eq('worker_id', id);

    if (workerServicesError) throw workerServicesError;

    // Delete worker record
    const { error: deleteWorkerError } = await supabase
      .from('workers')
      .delete()
      .eq('id', id);

    if (deleteWorkerError) throw deleteWorkerError;

    // Delete profile record
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('auth_id', worker.profile_id);

    if (deleteProfileError) throw deleteProfileError;

    // Delete auth user (admin API)
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(
      worker.profile_id,
    );

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting worker:', error);
    return NextResponse.json(
      { error: 'Failed to delete worker' },
      { status: 500 },
    );
  }
}
