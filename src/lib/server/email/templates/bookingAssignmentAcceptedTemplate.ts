import { renderNotificationTemplate } from './renderNotificationTemplate';

interface BookingAssignmentAcceptedEmailData {
  customerName: string;
  bookingId: string;
  workerName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
}

export function bookingAssignmentAcceptedTemplate(
  data: BookingAssignmentAcceptedEmailData,
) {
  return renderNotificationTemplate({
    title: 'Worker accepted your booking',
    notificationMessage:
      'Your assigned worker has accepted the booking and will attend your service.',
    sectionTitle: 'Booking assignment',
    details: [
      { label: 'Customer', value: data.customerName },
      { label: 'Booking ID', value: data.bookingId },
      { label: 'Worker', value: data.workerName },
      { label: 'Service', value: data.serviceName },
      { label: 'Date', value: data.bookingDate },
      { label: 'Time', value: data.bookingTime },
    ],
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${data.bookingId}`,
    ctaText: 'View Booking',
    preheader: 'Your assigned worker accepted your booking.',
  });
}
