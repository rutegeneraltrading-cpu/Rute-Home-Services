import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { contactMessageSchema } from '@/lib/validations';
import { sendEmail } from '@/lib/server/email/ses-mailer';
import {
  contactFormAdminTemplate,
  contactFormUserTemplate,
} from '@/lib/server/email';

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

    const adminEmail =
      process.env.ADMIN_CONTACT_EMAIL || process.env.AWS_SES_FROM_EMAIL;

    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `New Contact Form: ${data.subject}`,
          html: contactFormAdminTemplate({
            name: data.name,
            email: data.email,
            phone: data.phone || undefined,
            subject: data.subject,
            message: data.message,
            createdAt: new Date().toLocaleString('en-ZA', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
          }),
          replyTo: data.email,
        });
      } catch (emailError) {
        console.error('Contact admin email send failed:', emailError);
      }
    }

    try {
      await sendEmail({
        to: data.email,
        subject: `We received your inquiry: ${data.subject}`,
        html: contactFormUserTemplate({
          name: data.name,
          subject: data.subject,
          message: data.message,
          submittedAt: new Date().toLocaleString('en-ZA', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        }),
      });
    } catch (emailError) {
      console.error('Contact user confirmation email failed:', emailError);
    }

    return NextResponse.json({ message: 'Message received' }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to submit message';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
