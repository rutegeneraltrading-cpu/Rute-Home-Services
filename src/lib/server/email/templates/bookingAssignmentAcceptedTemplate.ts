import { renderNotificationTemplate } from './renderNotificationTemplate';
import type { BookingAssignmentAcceptedEmailData } from '@/lib/types/email';

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

function formatRequirementType(type?: string): string {
  if (!type) return '';
  const normalized = type.trim().toLowerCase();
  const labelMap: Record<string, string> = {
    size: 'Size',
    property_size: 'Property Size',
    truck_size: 'Truck Size',
    type: 'Type',
  };

  return (
    labelMap[normalized] ||
    normalized.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function bookingAssignmentAcceptedTemplate(
  data: BookingAssignmentAcceptedEmailData,
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

  const selectedRequirements =
    data.service.requirements || data.service.variants || [];

  if (selectedRequirements.length > 0) {
    serviceDetailsHtml += `
      <div style="margin-bottom: 8px; font-size: 13px; color: #4b5563;">
        <div style="font-weight: 500; color: #1f2937; margin-bottom: 4px;">Details:</div>
        ${selectedRequirements
          .map(
            (requirement) => `
          <div style="margin-left: 8px; margin-bottom: 3px;">
            <span style="color: #374151;">• ${requirement.name}</span>
            ${requirement.type ? `<span style="color: #6b7280;"> (${formatRequirementType(requirement.type)})</span>` : ''}
            ${typeof requirement.price === 'number' ? `<span style="color: #6b7280;"> (+R${requirement.price.toFixed(2)})</span>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
    `;
  }

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

  const workerImageHtml = data.worker.image
    ? `<img src="${data.worker.image}" alt="${data.worker.name}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; margin-bottom: 12px;">`
    : '';

  const customHtml = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 12px;">
      <div style="font-weight: 600; color: #0f172a; margin-bottom: 12px; font-size: 14px;">Service Details</div>
      <div style="font-size: 14px;">
        ${serviceDetailsHtml}
      </div>
    </div>

    <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 16px; margin-top: 12px;">
      <div style="font-weight: 600; color: #15803d; margin-bottom: 12px; font-size: 14px;">Your Assigned Professional</div>
      <div style="text-align: center;">
        ${workerImageHtml}
        <div style="font-weight: 600; color: #1f2937; font-size: 16px; margin-bottom: 4px;">${data.worker.name}</div>
        <div style="color: #6b7280; font-size: 13px;">Professional Service Provider</div>
      </div>
    </div>
  `;

  const isMovingBooking =
    !!data.address &&
    data.address.includes('to=') &&
    data.address.includes('from=');
  const ratePerKm = Number(data.service?.base_price || 0);

  return renderNotificationTemplate({
    title: `Professional assigned - ${serviceTitle}`,
    notificationMessage:
      'We have assigned a professional to your booking, and the professional has accepted the assignment. They will attend your service as scheduled.',
    sectionTitle: 'Booking details',
    details: [
      { label: 'Booking ID', value: data.bookingId },
      { label: 'Customer', value: data.customerName },
      { label: 'Service', value: data.service.name },
      ...(() => {
        if (
          data.address &&
          data.address.includes('to=') &&
          data.address.includes('from=')
        ) {
          const params = new URLSearchParams(data.address);
          const to = decodeURIComponent(params.get('to') || '');
          const from = decodeURIComponent(params.get('from') || '');
          return [
            { label: 'From', value: from || 'N/A' },
            { label: 'To', value: to || 'N/A' },
          ];
        }
        return [{ label: 'Address', value: data.address || 'N/A' }];
      })(),
      { label: 'Unit / Flat', value: data.unitOrFlat || 'N/A' },
      { label: 'Date', value: data.bookingDate },
      { label: 'Time', value: data.bookingTime },
      ...(isMovingBooking && ratePerKm > 0
        ? [
            { label: 'Pricing Model', value: 'Distance-based' },
            { label: 'Rate per km', value: `R${ratePerKm.toFixed(2)}` },
          ]
        : []),
      ...(data.priority_status && data.service?.priority_fee
        ? [
            {
              label: 'Priority Fee',
              value: `R${Number(data.service.priority_fee).toFixed(2)}`,
            },
          ]
        : []),
      { label: 'Notes', value: data.notes || 'N/A' },
    ],
    customHtml,
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${data.bookingId}`,
    ctaText: 'View Booking',
    preheader:
      'A professional has been assigned by our team and accepted your booking.',
  });
}
