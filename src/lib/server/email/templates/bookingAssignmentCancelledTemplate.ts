import { renderNotificationTemplate } from './renderNotificationTemplate';

interface BookingAssignmentCancelledEmailData {
  workerName: string;
  bookingId: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
}

export function bookingAssignmentCancelledTemplate(
  data: BookingAssignmentCancelledEmailData,
) {
  return renderNotificationTemplate({
    title: 'Booking assignment cancelled',
    notificationMessage:
      'Your previously assigned booking has been cancelled or reassigned by admin.',
    sectionTitle: 'Cancelled assignment details',
    details: [
      { label: 'Worker', value: data.workerName },
      { label: 'Booking ID', value: data.bookingId },
      { label: 'Service', value: data.serviceName },
      { label: 'Date', value: data.bookingDate },
      { label: 'Time', value: data.bookingTime },
      { label: 'Status', value: 'Cancelled / Reassigned' },
    ],
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/worker/bookings`,
    ctaText: 'View Assignments',
    preheader: 'A booking assignment for your account was cancelled.',
  });
}
