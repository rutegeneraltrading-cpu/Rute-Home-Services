import type { BookingServiceDetail } from '@/lib/types/email';
import { renderNotificationTemplate } from './renderNotificationTemplate';

const MAX_TITLE_LENGTH = 70;

function buildServiceTitle(
  serviceName: string,
  serviceCategory?: string,
): string {
  const title = serviceCategory
    ? `${serviceName} - ${serviceCategory}`
    : serviceName;
  return title.length > MAX_TITLE_LENGTH
    ? `${title.slice(0, MAX_TITLE_LENGTH - 3).trimEnd()}...`
    : title;
}

interface BookingAssignmentCancelledEmailData {
  workerName: string;
  bookingId: string;
  service: BookingServiceDetail;
  bookingDate: string;
  bookingTime: string;
}

export function bookingAssignmentCancelledTemplate(
  data: BookingAssignmentCancelledEmailData,
) {
  const serviceTitle = buildServiceTitle(
    data.service.name,
    data.service.category,
  );

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
    title: `Assignment cancelled - ${serviceTitle}`,
    notificationMessage:
      'Your booking assignment has been updated (cancelled, declined, or reassigned).',
    sectionTitle: 'Cancelled assignment details',
    details: [
      { label: 'Worker', value: data.workerName },
      { label: 'Service', value: data.service.name },
      { label: 'Date', value: data.bookingDate },
      { label: 'Time', value: data.bookingTime },
      { label: 'Status', value: 'Cancelled / Declined / Reassigned' },
    ],
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}`,
    ctaText: 'Visit RUTE',
    preheader: 'Your booking assignment was updated.',
    customHtml: serviceDetailsHtml,
  });
}
