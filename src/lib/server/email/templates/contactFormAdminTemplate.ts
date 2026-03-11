import { renderNotificationTemplate } from './renderNotificationTemplate';
import { ContactFormAdminEmailData } from '@/lib/types';

export function contactFormAdminTemplate(
  data: ContactFormAdminEmailData,
): string {
  return renderNotificationTemplate({
    title: 'New contact form submission',
    notificationMessage:
      'A customer has submitted a new message from the contact form.',
    sectionTitle: 'Inquiry details',
    details: [
      { label: 'Name', value: data.name },
      { label: 'Email', value: data.email },
      { label: 'Phone', value: data.phone || 'Not provided' },
      { label: 'Subject', value: data.subject },
      { label: 'Message', value: data.message },
      { label: 'Submitted At', value: data.createdAt },
    ],
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/admin/contacts`,
    ctaText: 'Open Contact Inbox',
    preheader: 'New contact inquiry requires review.',
  });
}
