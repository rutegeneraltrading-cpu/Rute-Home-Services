import { renderNotificationTemplate } from './renderNotificationTemplate';
import { AdminCreatedUserEmailData } from '@/lib/types';

export function adminCreatedUserTemplate(
  data: AdminCreatedUserEmailData,
): string {
  return renderNotificationTemplate({
    title: 'Your account was created by admin',
    notificationMessage:
      'A new account has been created for you. Please set a secure password before first login.',
    sectionTitle: 'Account details',
    details: [
      { label: 'Full Name', value: data.fullName },
      { label: 'Email', value: data.email },
      { label: 'Role', value: 'User' },
      { label: 'Recommendation', value: 'Reset password before sign-in' },
    ],
    ctaLink: data.resetPasswordUrl,
    ctaText: 'Set / Reset Password',
    preheader:
      'Your user account is ready. Reset your password and sign in securely.',
  });
}
