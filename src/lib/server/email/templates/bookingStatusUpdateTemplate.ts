import { renderNotificationTemplate } from './renderNotificationTemplate';

interface BookingStatusUpdateEmailData {
  customerName: string;
  bookingId: string;
  serviceName: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: string;
  detailsUrl: string;
}

export function bookingStatusUpdateTemplate(
  data: BookingStatusUpdateEmailData,
) {
  return renderNotificationTemplate({
    title: 'Booking status updated',
    notificationMessage: `Your booking status changed from ${data.previousStatus} to ${data.newStatus}.`,
    sectionTitle: 'Status update details',
    details: [
      { label: 'Booking ID', value: data.bookingId },
      { label: 'Customer', value: data.customerName },
      { label: 'Service', value: data.serviceName },
      { label: 'Previous Status', value: data.previousStatus },
      { label: 'Current Status', value: data.newStatus },
      { label: 'Updated At', value: data.updatedAt },
    ],
    ctaLink: data.detailsUrl,
    ctaText: 'View Booking',
    preheader: 'Your booking status was updated.',
  });
}
