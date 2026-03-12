import { renderNotificationTemplate } from './renderNotificationTemplate';
import type { BookingStatusUpdateEmailData } from '@/lib/types/email';

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

export function bookingStatusUpdateTemplate(
  data: BookingStatusUpdateEmailData,
) {
  const serviceTitle = buildServiceTitle(
    data.service.name,
    data.service.category,
  );

  let serviceDetailsHtml = `
    <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px; font-size: 15px;">
      ${data.service.name}
      ${data.service.category ? `<span style="color: #6b7280; font-weight: 400;"> - ${data.service.category}</span>` : ''}
    </div>
  `;

  if (data.service.options && data.service.options.length > 0) {
    serviceDetailsHtml += `
      <div style="margin-bottom: 8px; font-size: 13px; color: #4b5563;">
        <div style="font-weight: 500; color: #1f2937; margin-bottom: 4px;">Options:</div>
        ${data.service.options
          .map(
            (opt) => `
          <div style="margin-left: 8px; margin-bottom: 3px;">
            <span style="color: #374151;">• ${opt.name}</span>
            ${opt.price ? `<span style="color: #6b7280;"> (+R${opt.price.toFixed(2)})</span>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
    `;
  }

  if (data.service.variants && data.service.variants.length > 0) {
    serviceDetailsHtml += `
      <div style="margin-bottom: 8px; font-size: 13px; color: #4b5563;">
        <div style="font-weight: 500; color: #1f2937; margin-bottom: 4px;">Variants:</div>
        ${data.service.variants
          .map(
            (variant) => `
          <div style="margin-left: 8px; margin-bottom: 3px;">
            <span style="color: #374151;">• ${variant.name}</span>
            ${variant.price ? `<span style="color: #6b7280;"> (+R${variant.price.toFixed(2)})</span>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
    `;
  }

  const customHtml = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 12px;">
      <div style="font-weight: 600; color: #0f172a; margin-bottom: 12px; font-size: 14px;">Service Details</div>
      ${serviceDetailsHtml}
    </div>
  `;

  return renderNotificationTemplate({
    title: `Booking status update - ${serviceTitle}`,
    notificationMessage: `Your booking status changed from ${data.previousStatus} to ${data.newStatus}.`,
    sectionTitle: 'Status update details',
    details: [
      { label: 'Booking ID', value: data.bookingId },
      { label: 'Customer', value: data.customerName },
      { label: 'Booking Date', value: data.bookingDate },
      { label: 'Booking Time', value: data.bookingTime },
      { label: 'Previous Status', value: data.previousStatus },
      { label: 'Current Status', value: data.newStatus },
      { label: 'Updated At', value: data.updatedAt },
    ],
    customHtml,
    ctaLink: data.detailsUrl,
    ctaText: 'View Booking',
    preheader: 'Your booking status was updated.',
  });
}
