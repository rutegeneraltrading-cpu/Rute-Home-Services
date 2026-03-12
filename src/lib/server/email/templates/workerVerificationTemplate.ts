import { renderNotificationTemplate } from './renderNotificationTemplate';

interface WorkerVerificationEmailData {
  fullName: string;
  email: string;
  verificationStatus: 'approved' | 'rejected';
  changedAt: string;
}

export function workerVerificationTemplate(data: WorkerVerificationEmailData) {
  const approved = data.verificationStatus === 'approved';

  return renderNotificationTemplate({
    title: approved
      ? 'Account verification approved'
      : 'Account verification rejected',
    notificationMessage: approved
      ? 'Congratulations! Your worker account has been verified and approved.'
      : 'Your worker account verification was not approved. Please contact support for more details.',
    sectionTitle: 'Verification status',
    details: [
      { label: 'Full Name', value: data.fullName },
      { label: 'Email', value: data.email },
      {
        label: 'Verification Status',
        value: approved ? 'Approved' : 'Rejected',
      },
      {
        label: 'Update Details',
        value: approved
          ? 'You are now approved to accept service assignments from customers.'
          : 'Please contact our support team for resubmission guidance.',
      },
      { label: 'Updated At', value: data.changedAt },
    ],
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}`,
    ctaText: 'Visit RUTE',
    preheader: approved
      ? 'Your worker account has been verified and approved.'
      : 'Your worker account verification was not approved.',
  });
}
