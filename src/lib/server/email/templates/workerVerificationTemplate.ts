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
    title: approved ? 'Verification approved' : 'Verification update',
    notificationMessage: approved
      ? 'Your worker verification has been approved.'
      : 'Your worker verification requires attention.',
    sectionTitle: 'Verification details',
    details: [
      { label: 'Name', value: data.fullName },
      { label: 'Email', value: data.email },
      {
        label: 'Verification Status',
        value: approved ? 'Approved' : 'Rejected',
      },
      {
        label: 'Next Step',
        value: approved
          ? 'You can proceed with accepting service assignments.'
          : 'Please review your documents and resubmit if required.',
      },
      { label: 'Updated At', value: data.changedAt },
    ],
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    ctaText: approved ? 'Open Worker Dashboard' : 'View Worker Profile',
    preheader: approved
      ? 'Your worker verification was approved.'
      : 'Your worker verification status was updated.',
  });
}
