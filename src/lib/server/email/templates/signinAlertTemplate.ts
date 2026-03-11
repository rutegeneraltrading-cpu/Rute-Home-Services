import { SigninAlertEmailData } from '@/lib/types';
import { renderNotificationTemplate } from './renderNotificationTemplate';

export function signinAlertTemplate(data: SigninAlertEmailData): string {
  return renderNotificationTemplate({
    title: 'Sign-in alert',
    notificationMessage: 'A new sign-in was detected on your account.',
    sectionTitle: 'Sign-in details',
    details: [
      { label: 'Account', value: data.name },
      { label: 'Time', value: data.loginTime },
      { label: 'Device', value: data.device || 'Unknown device' },
      { label: 'IP Address', value: data.ipAddress || 'Unknown' },
      ...(data.location ? [{ label: 'Location', value: data.location }] : []),
    ],
    ctaLink: data.resetPasswordUrl,
    ctaText: 'Secure Account',
    preheader:
      'New sign-in detected. Review and secure your account if needed.',
  });
}
