import { NextResponse, NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { sendResendEmail } from '@/lib/server/email';
import { workerVerificationTemplate } from '@/lib/server/email';

const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

const normalizeToE164 = (value: unknown): string | null => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const digitsOnly = raw.replace(/\D/g, '');
  if (!digitsOnly) return null;
  return `+${digitsOnly}`;
};

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

    // Get all worker_services for this worker
    const { data: workerServices } = await supabase
      .from('worker_services')
      .select(
        `service_id, service:services (name, service_categories:category_id (name))`,
      )
      .eq('worker_id', workerId);

    const serviceNames = (workerServices || [])
      .map((ws: any) => ws?.service?.name)
      .filter(Boolean);
    const categoryNames = (workerServices || [])
      .map((ws: any) => ws?.service?.service_categories?.name)
      .filter(Boolean);
    const serviceIds = (workerServices || [])
      .map((ws: any) => ws?.service_id)
      .filter(Boolean);

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
        service_names: Array.from(new Set(serviceNames)),
        service_category_names: Array.from(new Set(categoryNames)),
        service_ids: Array.from(new Set(serviceIds)),
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

    const { data: workerProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', worker.profile_id)
      .maybeSingle();

    // Extract profile fields and status
    const {
      full_name,
      email,
      avatar_url,
      status,
      address,
      service_ids,
      worker_documents,
      ...rest
    } = body;
    // Remove service_ids and worker_documents from workerFields
    const workerFields = { ...rest };

    const normalizedWorkerPhone = body.phone
      ? normalizeToE164(body.phone)
      : undefined;

    if (
      body.phone &&
      (!normalizedWorkerPhone || !E164_PHONE_REGEX.test(normalizedWorkerPhone))
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid phone number format. Use international format (E.164), e.g. +27821234567',
        },
        { status: 400 },
      );
    }

    if (normalizedWorkerPhone) {
      workerFields.phone = normalizedWorkerPhone;
    }

    const normalizedAddressPhone = address?.phone
      ? normalizeToE164(address.phone)
      : undefined;

    if (
      address?.phone &&
      (!normalizedAddressPhone ||
        !E164_PHONE_REGEX.test(normalizedAddressPhone))
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid address phone format. Use international format (E.164), e.g. +27821234567',
        },
        { status: 400 },
      );
    }

    let verificationOutcome: 'approved' | 'rejected' | null = null;

    if (Array.isArray(worker_documents) && worker_documents.length > 0) {
      const statuses = worker_documents
        .map((doc) => doc?.status)
        .filter((status): status is string => typeof status === 'string');

      if (statuses.includes('rejected')) {
        verificationOutcome = 'rejected';
      } else if (
        statuses.length > 0 &&
        statuses.every((s) => s === 'approved')
      ) {
        verificationOutcome = 'approved';
      }
    }

    // Update worker_documents status if provided
    if (Array.isArray(worker_documents) && worker_documents.length > 0) {
      for (const doc of worker_documents) {
        if (!['pending', 'approved', 'rejected'].includes(doc.status)) {
          console.error('worker_documents update skipped: invalid status', doc);
          continue;
        }
        const { data: updatedDoc, error: docUpdateError } = await supabase
          .from('worker_documents')
          .update({ status: doc.status })
          .eq('worker_id', workerId)
          .select()
          .single();
        if (docUpdateError) {
          console.error('worker_documents update error:', docUpdateError, doc);
          throw docUpdateError;
        }
        if (!updatedDoc) {
          console.error(
            'worker_documents update failed: no document found for id',
            doc.id,
          );
        } else {
          console.log('worker_documents updated:', updatedDoc);
        }
      }
    }

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

    if (verificationOutcome && workerProfile?.email) {
      try {
        await sendResendEmail({
          to: workerProfile.email,
          subject:
            verificationOutcome === 'approved'
              ? 'Worker verification approved'
              : 'Worker verification update',
          html: workerVerificationTemplate({
            fullName: workerProfile.full_name || full_name || 'Worker',
            email: workerProfile.email,
            verificationStatus: verificationOutcome,
            changedAt: new Date().toLocaleString('en-ZA', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
          }),
        });
      } catch (emailError) {
        console.error('Worker verification email send failed:', emailError);
      }
    }

    // Update worker fields
    const { data: updatedWorker, error: workerUpdateError } = await supabase
      .from('workers')
      .update(workerFields)
      .eq('id', workerId)
      .select()
      .single();

    if (workerUpdateError) throw workerUpdateError;

    // Update worker service assignments if provided
    if (Array.isArray(body.service_ids)) {
      // Remove all previous assignments
      const { error: deleteWorkerServicesError } = await supabase
        .from('worker_services')
        .delete()
        .eq('worker_id', workerId);
      if (deleteWorkerServicesError) throw deleteWorkerServicesError;

      // Insert new assignments
      for (const sid of body.service_ids) {
        const { error: insertWorkerServiceError } = await supabase
          .from('worker_services')
          .insert({
            worker_id: workerId,
            service_id: sid,
            is_active: true,
          });
        if (insertWorkerServiceError) throw insertWorkerServiceError;
      }
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
                  normalizedAddressPhone ||
                  normalizedWorkerPhone ||
                  existingPrimary.phone,
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
                phone: normalizedAddressPhone || normalizedWorkerPhone || null,
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
          .update({
            phone: normalizedAddressPhone || normalizedWorkerPhone || null,
          })
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
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : error &&
              typeof error === 'object' &&
              'toString' in error &&
              typeof error.toString === 'function'
            ? error.toString()
            : 'Failed to update worker';
    return NextResponse.json(
      {
        error: errorMessage,
        details: error,
      },
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
