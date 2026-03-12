import { renderNotificationTemplate } from './renderNotificationTemplate';
import { WorkerWelcomeEmailData } from '@/lib/types';

export function workerWelcomeTemplate(data: WorkerWelcomeEmailData): string {
  return renderNotificationTemplate({
    title: 'Welcome to RUTE',
    notificationMessage:
      'Your worker account has been created successfully and is now under review. We will notify you once your account is verified.',
    sectionTitle: 'Account details',
    details: [
      { label: 'Full Name', value: data.fullName },
      { label: 'Email', value: data.email },
      { label: 'Assigned Services', value: String(data.servicesCount) },
      { label: 'Account Status', value: 'Under Review' },
    ],
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/contact-us`,
    ctaText: 'RUTE Support',
    preheader: 'Your worker account has been created and is under review.',
  });
}
