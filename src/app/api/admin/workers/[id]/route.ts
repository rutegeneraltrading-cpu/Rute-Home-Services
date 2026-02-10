import { NextResponse, NextRequest } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();
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
      .eq('id', worker.profile_id)
      .single();

    if (profileError) throw profileError;

    const { data: primaryAddress } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('is_primary', true)
      .maybeSingle();

    return NextResponse.json({
      worker: {
        ...profile,
        ...worker,
        primary_address: primaryAddress || null,
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
    const supabase = await createAdminClient();
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
    const {
      full_name,
      email,
      avatar_url,
      status,
      service_id,
      address,
      ...workerFields
    } = body;

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
        .eq('id', worker.profile_id);

      if (profileError) throw profileError;
    } else if (status) {
      // If only status is being updated
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', worker.profile_id);

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

    // Update worker service assignment if provided
    if (service_id) {
      const { error: deleteWorkerServicesError } = await supabase
        .from('worker_services')
        .delete()
        .eq('worker_id', workerId);

      if (deleteWorkerServicesError) throw deleteWorkerServicesError;

      const { error: insertWorkerServiceError } = await supabase
        .from('worker_services')
        .insert({
          worker_id: workerId,
          service_id,
          is_active: true,
        });

      if (insertWorkerServiceError) throw insertWorkerServiceError;
    }

    // Update worker address
    let primaryAddress = null;
    if (address) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', worker.profile_id)
        .single();

      if (profile?.id) {
        const { data: existingPrimary } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('is_primary', true)
          .maybeSingle();

        if (existingPrimary) {
          const { data: updatedAddress, error: addressUpdateError } =
            await supabase
              .from('user_addresses')
              .update({
                label: address.label || existingPrimary.label,
                recipient_name:
                  address.recipient_name ||
                  full_name ||
                  existingPrimary.recipient_name,
                phone:
                  address.phone || workerFields.phone || existingPrimary.phone,
                line1: address.line1,
                line2: address.line2 || null,
                city: address.city,
                state_province: address.state_province,
                postal_code: address.postal_code,
                country: address.country,
                is_primary: true,
              })
              .eq('id', existingPrimary.id)
              .select('*')
              .single();

          if (addressUpdateError) throw addressUpdateError;
          primaryAddress = updatedAddress;
        } else {
          const { data: createdAddress, error: addressCreateError } =
            await supabase
              .from('user_addresses')
              .insert({
                profile_id: profile.id,
                label: address.label || 'home',
                recipient_name: address.recipient_name || full_name || null,
                phone: address.phone || workerFields.phone || null,
                line1: address.line1,
                line2: address.line2 || null,
                city: address.city,
                state_province: address.state_province,
                postal_code: address.postal_code,
                country: address.country,
                is_primary: true,
              })
              .select('*')
              .single();

          if (addressCreateError) throw addressCreateError;
          primaryAddress = createdAddress;
        }

        await supabase
          .from('profiles')
          .update({ phone: address.phone || workerFields.phone || null })
          .eq('id', worker.profile_id);
      }
    }

    // Get updated profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', worker.profile_id)
      .single();

    return NextResponse.json({
      worker: {
        ...profile,
        ...updatedWorker,
        primary_address: primaryAddress || null,
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
    const supabase = await createAdminClient();
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
      .eq('id', worker.profile_id)
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
        ...profile,
        ...updatedWorker,
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
    const supabase = await createAdminClient();
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

    const { data: profileForAuth } = await supabase
      .from('profiles')
      .select('auth_id')
      .eq('id', worker.profile_id)
      .maybeSingle();

    // Delete profile record
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', worker.profile_id);

    if (deleteProfileError) throw deleteProfileError;

    // Delete auth user (admin API)
    const authId = profileForAuth?.auth_id;
    const { error: deleteAuthError } = authId
      ? await adminClient.auth.admin.deleteUser(authId)
      : { error: null };

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
