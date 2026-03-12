import type { BookingServiceDetail } from '@/lib/types/email';
import { renderNotificationTemplate } from './renderNotificationTemplate';

interface BookingAssignedToWorkerEmailData {
  workerName: string;
  bookingId: string;
  service: BookingServiceDetail;
  bookingDate: string;
  bookingTime: string;
  customerName: string;
}

export function bookingAssignedToWorkerTemplate(
  data: BookingAssignedToWorkerEmailData,
) {
  let serviceDetailsHtml = `
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.05em;">Service Details</p>
      <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#111827;">${data.service.name}</p>`;

  if (data.service.category) {
    serviceDetailsHtml += `<p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Category: ${data.service.category}</p>`;
  }

  if (data.service.options && data.service.options.length > 0) {
    serviceDetailsHtml += `<p style="margin:12px 0 6px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Selected Options</p><ul style="margin:0;padding-left:18px;">`;
    for (const opt of data.service.options) {
      serviceDetailsHtml += `<li style="font-size:13px;color:#374151;margin-bottom:4px;">${opt.name}${opt.price ? ` — R${opt.price}` : ''}${opt.description ? ` <span style="color:#6b7280;">(${opt.description})</span>` : ''}</li>`;
    }
    serviceDetailsHtml += `</ul>`;
  }

  if (data.service.variants && data.service.variants.length > 0) {
    serviceDetailsHtml += `<p style="margin:12px 0 6px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Selected Variants</p><ul style="margin:0;padding-left:18px;">`;
    for (const v of data.service.variants) {
      serviceDetailsHtml += `<li style="font-size:13px;color:#374151;margin-bottom:4px;">${v.name}${v.type ? ` (${v.type})` : ''}${v.price ? ` — R${v.price}` : ''}</li>`;
    }
    serviceDetailsHtml += `</ul>`;
  }

  serviceDetailsHtml += `</div>`;

  return renderNotificationTemplate({
    title: 'New booking assigned',
    notificationMessage:
      'A new booking has been assigned to you. Please review the details below.',
    sectionTitle: 'Assignment details',
    details: [
      { label: 'Worker', value: data.workerName },
      { label: 'Service', value: data.service.name },
      { label: 'Date', value: data.bookingDate },
      { label: 'Time', value: data.bookingTime },
      { label: 'Customer', value: data.customerName },
    ],
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/contact-us`,
    ctaText: 'Visit RUTE Support',
    preheader: 'A new booking has been assigned to you.',
    customHtml: serviceDetailsHtml,
  });
}
