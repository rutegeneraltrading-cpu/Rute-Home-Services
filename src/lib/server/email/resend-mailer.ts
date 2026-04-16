import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResendEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}) {
  return resend.emails.send({
    from: from || process.env.DEFAULT_FROM || '',
    to,
    subject,
    html,
    text,
    replyTo,
  });
}
