import { renderNotificationTemplate } from './renderNotificationTemplate';

interface UserStatusChangeEmailData {
  fullName: string;
  email: string;
  status: string;
  changedAt: string;
}

export function userStatusChangeTemplate(data: UserStatusChangeEmailData) {
  return renderNotificationTemplate({
    title: 'Account status updated',
    notificationMessage: `Your account status has been changed to ${data.status}.`,
    sectionTitle: 'Status details',
    details: [
      { label: 'Name', value: data.fullName },
      { label: 'Email', value: data.email },
      { label: 'New Status', value: data.status },
      { label: 'Updated At', value: data.changedAt },
    ],
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/contact-us`,
    ctaText: 'Contact Support',
    preheader: 'Your account status has been updated by admin.',
  });
}
