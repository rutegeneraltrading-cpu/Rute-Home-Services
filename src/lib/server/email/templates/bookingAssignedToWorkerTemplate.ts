import { renderNotificationTemplate } from './renderNotificationTemplate';

interface BookingAssignedToWorkerEmailData {
  workerName: string;
  bookingId: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  customerName: string;
}

export function bookingAssignedToWorkerTemplate(
  data: BookingAssignedToWorkerEmailData,
) {
  return renderNotificationTemplate({
    title: 'New booking assigned',
    notificationMessage:
      'A new booking has been assigned to you. Please review and accept it.',
    sectionTitle: 'Assignment details',
    details: [
      { label: 'Worker', value: data.workerName },
      { label: 'Booking ID', value: data.bookingId },
      { label: 'Service', value: data.serviceName },
      { label: 'Date', value: data.bookingDate },
      { label: 'Time', value: data.bookingTime },
      { label: 'Customer', value: data.customerName },
    ],
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/worker/bookings`,
    ctaText: 'Review Assignment',
    preheader: 'A new booking has been assigned to you.',
  });
}
