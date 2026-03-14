import { NextResponse, NextRequest } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/server/email/ses-mailer';
import { workerWelcomeTemplate } from '@/lib/server/email';

const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

const normalizeToE164 = (value: unknown): string | null => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const digitsOnly = raw.replace(/\D/g, '');
  if (!digitsOnly) return null;
  return `+${digitsOnly}`;
};

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = await createAdminClient();

    const body = await request.json();
    const {
      full_name,
      email,
      phone,
      address,
      service_ids,
      profile_status,
      avatar_url,
    } = body;

    const statusToSet: 'active' | 'inactive' | 'suspended' =
      profile_status === 'inactive' || profile_status === 'suspended'
        ? profile_status
        : 'active';

    // Validate required fields
    if (
      !full_name ||
      !email ||
      !Array.isArray(service_ids) ||
      service_ids.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: full_name, email, service_ids (array)',
        },
        { status: 400 },
      );
    }

    if (
      !address ||
      !address.line1 ||
      !address.city ||
      !address.state_province ||
      !address.postal_code ||
      !address.country
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required address fields: line1, city, state_province, postal_code, country',
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizeToE164(phone);

    if (
      phone &&
      (!normalizedPhone || !E164_PHONE_REGEX.test(normalizedPhone))
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid phone number format. Use international format (E.164), e.g. +27821234567',
        },
        { status: 400 },
      );
    }

    const normalizedAddressPhone = normalizeToE164(address?.phone);

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

    const { data: existingProfile, error: existingProfileError } =
      await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

    if (existingProfileError) throw existingProfileError;

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Worker already exists with this email' },
        { status: 409 },
      );
    }

    let existingAuthUser = null as null | { id: string; email?: string };
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5 && !existingAuthUser) {
      const { data: authUsers, error: existingAuthError } =
        await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 200,
        });

      if (existingAuthError) {
        console.error('Auth lookup error:', existingAuthError);
        throw new Error('Unable to verify email uniqueness');
      }

      const users = authUsers?.users || [];
      existingAuthUser =
        users.find((user) => user.email?.toLowerCase() === normalizedEmail) ||
        null;

      hasMore = users.length === 200;
      page += 1;
    }

    if (existingAuthUser?.id) {
      return NextResponse.json(
        { error: 'Worker already exists with this email' },
        { status: 409 },
      );
    }

    // Generate a strong random password for the worker
    const tempPassword = crypto.randomBytes(16).toString('base64url');

    console.log('Creating worker with email:', email);

    // Step 1: Create auth user via admin client
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
        user_metadata: {
          full_name,
          role: 'worker',
          ...(normalizedPhone ? { phone: normalizedPhone } : {}),
        },
      });

    if (authError) {
      console.error('Auth creation error:', authError);
      throw new Error(authError.message || 'Failed to create auth user');
    }

    const auth_id = authData.user.id;
    console.log('Auth user created:', auth_id);

    // Step 2: Create profile record
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          auth_id,
          full_name,
          email: normalizedEmail,
          ...(normalizedPhone ? { phone: normalizedPhone } : {}),
          role: 'worker',
          status: statusToSet,
          ...(avatar_url ? { avatar_url } : {}),
        },
        { onConflict: 'auth_id' },
      )
      .select()
      .single();

    if (profileError) throw profileError;
    console.log('Profile created:', profile.auth_id);

    const profileId = profile?.id;
    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID missing' },
        { status: 500 },
      );
    }

    // Step 3: Create or reuse worker record
    const { data: existingWorker, error: existingWorkerError } =
      await supabaseAdmin
        .from('workers')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

    if (existingWorkerError) throw existingWorkerError;

    let workerId = existingWorker?.id;

    if (!workerId) {
      const { data: worker, error: workerError } = await supabaseAdmin
        .from('workers')
        .insert({
          profile_id: profileId,
          phone: normalizedPhone,
          is_active: true,
        })
        .select()
        .single();

      if (workerError) throw workerError;
      workerId = worker.id;
      console.log('Worker record created:', workerId);
    }

    // Step 4: Create worker_services entries for each service_id
    if (Array.isArray(service_ids) && service_ids.length > 0) {
      for (const sid of service_ids) {
        // Check if already exists
        const {
          data: existingWorkerService,
          error: existingWorkerServiceError,
        } = await supabaseAdmin
          .from('worker_services')
          .select('id')
          .eq('worker_id', workerId)
          .eq('service_id', sid)
          .maybeSingle();
        if (existingWorkerServiceError) throw existingWorkerServiceError;
        if (!existingWorkerService) {
          const { error: workerServiceError } = await supabaseAdmin
            .from('worker_services')
            .insert({
              worker_id: workerId,
              service_id: sid,
              is_active: true,
            });
          if (workerServiceError) throw workerServiceError;
        }
      }
    }

    // Step 5: Save worker address in user_addresses
    if (address) {
      const { error: resetError } = await supabaseAdmin
        .from('user_addresses')
        .update({ is_primary: false })
        .eq('profile_id', profileId);

      if (resetError) throw resetError;

      const { error: addressError } = await supabaseAdmin
        .from('user_addresses')
        .insert({
          profile_id: profileId,
          label: address.label || 'home',
          recipient_name: address.recipient_name || full_name || null,
          phone: normalizedAddressPhone || normalizedPhone,
          line1: address.line1,
          line2: address.line2 || null,
          city: address.city,
          state_province: address.state_province,
          postal_code: address.postal_code,
          country: address.country,
          is_primary: true,
        });

      if (addressError) throw addressError;

      await supabaseAdmin
        .from('profiles')
        .update({ phone: normalizedAddressPhone || normalizedPhone })
        .eq('id', profileId);
    }

    if (!workerId) {
      throw new Error('Worker record not found or created');
    }

    // Step 6: Insert worker_documents if provided
    const { documents } = body;
    if (Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        await supabaseAdmin.from('worker_documents').insert({
          worker_id: workerId,
          document_type: doc.type,
          file_url: doc.file_url,
          status: 'pending',
          uploaded_at: new Date().toISOString(),
        });
      }
    }

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Welcome to RUTE',
        html: workerWelcomeTemplate({
          fullName: full_name,
          email: normalizedEmail,
          servicesCount: Array.isArray(service_ids) ? service_ids.length : 0,
        }),
      });
    } catch (emailError) {
      console.error('Worker welcome email send failed:', emailError);
    }

    return NextResponse.json(
      {
        worker: {
          ...profile,
          profile_id: profileId,
          id: workerId,
        },
        message: 'Worker created successfully. Account is under review.',
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
