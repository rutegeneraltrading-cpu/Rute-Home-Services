import { renderNotificationTemplate } from './renderNotificationTemplate';

interface BookingCreatedEmailData {
  customerName: string;
  bookingId: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  total: number;
  paymentStatus: string;
  detailsUrl: string;
}

export function bookingCreatedTemplate(data: BookingCreatedEmailData): string {
  return renderNotificationTemplate({
    title: 'Booking created successfully',
    notificationMessage:
      'Your service booking request has been created and is pending payment.',
    sectionTitle: 'Booking details',
    details: [
      { label: 'Booking ID', value: data.bookingId },
      { label: 'Customer', value: data.customerName },
      { label: 'Service', value: data.serviceName },
      { label: 'Booking Date', value: data.bookingDate },
      { label: 'Booking Time', value: data.bookingTime },
      { label: 'Total', value: `R${data.total.toFixed(2)}` },
      { label: 'Payment Status', value: data.paymentStatus },
    ],
    ctaLink: data.detailsUrl,
    ctaText: 'View Booking',
    preheader: 'Your booking has been created successfully.',
  });
}
