import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { contactMessageSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const authClient = await createClient();
    const body = await request.json();
    const data = contactMessageSchema.parse(body);

    const {
      data: { user },
    } = await authClient.auth.getUser();

    let profileId: string | null = null;

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      profileId = profile?.id ?? null;
    }

    const { error } = await supabase.from('contact_messages').insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
      status: 'new',
      profile_id: profileId,
    });

    if (error) throw error;

    return NextResponse.json({ message: 'Message received' }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to submit message';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
