import { renderNotificationTemplate } from './renderNotificationTemplate';
import { ContactFormUserEmailData } from '@/lib/types';

export function contactFormUserTemplate(
  data: ContactFormUserEmailData,
): string {
  return renderNotificationTemplate({
    title: 'We received your message',
    notificationMessage:
      'Thank you for contacting RUTE. Our team has received your inquiry and will get back to you shortly.',
    sectionTitle: 'Your submitted details',
    details: [
      { label: 'Name', value: data.name },
      { label: 'Subject', value: data.subject },
      { label: 'Message', value: data.message },
      { label: 'Submitted At', value: data.submittedAt },
      { label: 'Status', value: 'Received' },
    ],
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/contact-us`,
    ctaText: 'Visit RUTE',
    preheader: 'Your contact request has been received.',
  });
}
