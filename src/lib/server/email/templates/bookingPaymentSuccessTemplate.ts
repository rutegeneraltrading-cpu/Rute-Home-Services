import { renderNotificationTemplate } from './renderNotificationTemplate';

interface BookingPaymentSuccessEmailData {
  audience: 'user' | 'admin';
  customerName: string;
  bookingId: string;
  total: number;
  transactionId?: string | null;
  paidAt: string;
  detailsUrl: string;
}

export function bookingPaymentSuccessTemplate(
  data: BookingPaymentSuccessEmailData,
): string {
  const notificationMessage =
    data.audience === 'admin'
      ? 'Booking payment was completed successfully.'
      : 'Your booking payment has been confirmed successfully.';

  return renderNotificationTemplate({
    title:
      data.audience === 'admin'
        ? 'Booking payment received'
        : 'Booking payment successful',
    notificationMessage,
    sectionTitle: 'Payment details',
    details: [
      { label: 'Booking ID', value: data.bookingId },
      { label: 'Customer', value: data.customerName },
      { label: 'Total Paid', value: `R${data.total.toFixed(2)}` },
      { label: 'Transaction ID', value: data.transactionId || 'Not available' },
      { label: 'Paid At', value: data.paidAt },
      { label: 'Payment Status', value: 'Paid' },
    ],
    ctaLink: data.detailsUrl,
    ctaText:
      data.audience === 'admin' ? 'Open Booking in Admin' : 'View My Booking',
    preheader:
      data.audience === 'admin'
        ? 'A booking payment has been received.'
        : 'Your booking payment has been completed.',
  });
}
