import { ResetPasswordChangedEmailData } from '@/lib/types';
import { renderNotificationTemplate } from './renderNotificationTemplate';

export function resetPasswordChangedTemplate(
  data: ResetPasswordChangedEmailData,
): string {
  return renderNotificationTemplate({
    title: 'Password updated',
    notificationMessage: 'Your account password was changed successfully.',
    sectionTitle: 'Security details',
    details: [
      { label: 'Account', value: data.name },
      { label: 'Changed at', value: data.changedAt },
      { label: 'Status', value: 'Password changed' },
    ],
    ctaLink: data.resetPasswordUrl,
    ctaText: 'Reset Password Again',
    preheader:
      'Your password was changed. If this was not you, secure your account now.',
  });
}
