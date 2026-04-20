import { renderNotificationTemplate } from './renderNotificationTemplate';

interface AdditionalWorkPaymentSuccessData {
  audience: 'user' | 'admin' | 'worker';
  customerName: string;
  bookingId: string;
  additionalWorkId: string;
  description: string;
  fee: number;
  serviceName: string;
  transactionId?: string;
  dashboardUrl: string;
}

export function additionalWorkPaymentSuccessTemplate(
  data: AdditionalWorkPaymentSuccessData,
): string {
  const audienceMessages = {
    user: 'Your additional work payment has been confirmed successfully.',
    admin: 'A customer has paid for additional work on their booking.',
    worker:
      'The customer has paid for additional work. Please proceed accordingly.',
  };

  const audienceTitles = {
    user: `Additional Work Payment Confirmed - ${data.serviceName}`,
    admin: `Additional Work Payment Received - ${data.serviceName}`,
    worker: `Additional Work Payment Received - ${data.serviceName}`,
  };

  const ctaTexts = {
    user: 'View My Booking',
    admin: 'Open Booking in Admin',
    worker: 'View Booking',
  };

  const preheaders = {
    user: 'Your additional work payment has been completed.',
    admin: 'An additional work payment has been received.',
    worker: 'A customer has paid for additional work on their booking.',
  };

  return renderNotificationTemplate({
    title: audienceTitles[data.audience],
    notificationMessage: audienceMessages[data.audience],
    sectionTitle: 'Additional Work Details',
    details: [
      { label: 'Booking ID', value: data.bookingId },
      { label: 'Customer', value: data.customerName },
      { label: 'Service', value: data.serviceName },
      { label: 'Description', value: data.description },
      { label: 'Amount Paid', value: `R${data.fee.toFixed(2)}` },
      ...(data.transactionId
        ? [{ label: 'Transaction ID', value: data.transactionId }]
        : []),
      { label: 'Payment Status', value: 'Paid' },
    ],
    ctaLink: data.dashboardUrl,
    ctaText: ctaTexts[data.audience],
    preheader: preheaders[data.audience],
  });
}
