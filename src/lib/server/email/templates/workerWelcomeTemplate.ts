import { renderNotificationTemplate } from './renderNotificationTemplate';
import { WorkerWelcomeEmailData } from '@/lib/types';

export function workerWelcomeTemplate(data: WorkerWelcomeEmailData): string {
  return renderNotificationTemplate({
    title: 'Welcome to RUTE Worker Portal',
    notificationMessage:
      'Your worker account has been created and submitted for review.',
    sectionTitle: 'Worker account details',
    details: [
      { label: 'Full Name', value: data.fullName },
      { label: 'Email', value: data.email },
      { label: 'Assigned Services', value: String(data.servicesCount) },
      { label: 'Status', value: 'Under verification / review' },
    ],
    ctaLink: data.loginUrl,
    ctaText: 'Open Worker Login',
    preheader:
      'Your worker account is ready. Log in and complete your profile.',
  });
}
