import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = await createAdminClient();
    const supabase = await createClient();

    const body = await request.json();
    const { full_name, email, phone, address, service_id, hourly_rate } = body;

    // Validate required fields
    if (!full_name || !email || !service_id) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, email, service_id' },
        { status: 400 },
      );
    }

    // Check if profile already exists
    const { data: existingProfile, error: existingProfileError } =
      await supabase
        .from('profiles')
        .select('auth_id, role')
        .eq('email', email)
        .maybeSingle();

    if (existingProfileError) throw existingProfileError;

    let auth_id: string;
    let profile: {
      auth_id: string;
      full_name: string;
      email: string;
      role: string;
      status: string;
    } | null = null;

    if (existingProfile) {
      auth_id = existingProfile.auth_id;

      // Ensure profile is set to worker role
      const { data: updatedProfile, error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          full_name,
          role: 'worker',
          status: 'active',
        })
        .eq('auth_id', auth_id)
        .select()
        .single();

      if (updateProfileError) throw updateProfileError;
      profile = updatedProfile;

      // Keep auth metadata in sync
      await supabaseAdmin.auth.admin.updateUserById(auth_id, {
        user_metadata: {
          full_name,
          role: 'worker',
        },
      });
    } else {
      // Generate a random password for the worker
      const tempPassword = Math.random().toString(36).slice(-16);

      console.log('Creating worker with email:', email);

      // Step 1: Create auth user via admin client
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          user_metadata: {
            full_name,
            role: 'worker',
          },
        });

      if (authError) {
        console.error('Auth creation error:', authError);
        throw new Error(authError.message || 'Failed to create auth user');
      }

      auth_id = authData.user.id;
      console.log('Auth user created:', auth_id);

      // Step 2: Create profile record
      const { data: createdProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            auth_id,
            full_name,
            email,
            role: 'worker',
            status: 'active',
          },
          { onConflict: 'auth_id' },
        )
        .select()
        .single();

      if (profileError) throw profileError;
      profile = createdProfile;
      console.log('Profile created:', createdProfile.auth_id);
    }

    // Step 3: Create or reuse worker record
    const { data: existingWorker, error: existingWorkerError } = await supabase
      .from('workers')
      .select('id')
      .eq('profile_id', auth_id)
      .maybeSingle();

    if (existingWorkerError) throw existingWorkerError;

    let workerId = existingWorker?.id;

    if (!workerId) {
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .insert({
          profile_id: auth_id,
          phone: phone || null,
          address: address || null,
          hourly_rate: hourly_rate || 0,
          is_active: true,
        })
        .select()
        .single();

      if (workerError) throw workerError;
      workerId = worker.id;
      console.log('Worker record created:', workerId);
    }

    // Step 4: Create worker_services entry if missing
    const { data: existingWorkerService, error: existingWorkerServiceError } =
      await supabase
        .from('worker_services')
        .select('id')
        .eq('worker_id', workerId)
        .eq('service_id', service_id)
        .maybeSingle();

    if (existingWorkerServiceError) throw existingWorkerServiceError;

    if (!existingWorkerService) {
      const { error: workerServiceError } = await supabase
        .from('worker_services')
        .insert({
          worker_id: workerId,
          service_id,
          is_active: true,
        });

      if (workerServiceError) throw workerServiceError;
      console.log('Worker service created');
    }

    if (!workerId) {
      throw new Error('Worker record not found or created');
    }

    return NextResponse.json(
      {
        worker: {
          ...profile,
          profile_id: auth_id,
          id: workerId,
        },
        message:
          'Worker created successfully. They can now log in with their email.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating worker:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create worker';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
