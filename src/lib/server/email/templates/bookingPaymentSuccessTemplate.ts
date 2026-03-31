import { renderNotificationTemplate } from './renderNotificationTemplate';
import type { BookingPaymentSuccessEmailData } from '@/lib/types/email';

const MAX_TITLE_LENGTH = 70;

function buildServiceTitle(
  serviceName: string,
  serviceCategory?: string,
): string {
  const fullName = serviceCategory
    ? `${serviceName} - ${serviceCategory}`
    : serviceName;
  return fullName.length > MAX_TITLE_LENGTH
    ? fullName.substring(0, MAX_TITLE_LENGTH - 3) + '...'
    : fullName;
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

export function bookingPaymentSuccessTemplate(
  data: BookingPaymentSuccessEmailData,
): string {
  const serviceTitle = buildServiceTitle(
    data.service.name,
    data.service.category,
  );
  const notificationMessage =
    data.audience === 'admin'
      ? 'Booking payment was completed successfully.'
      : 'Your booking payment has been confirmed successfully.';

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

  const customHtml = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 12px; font-size: 14px;">
      <div style="font-weight: 600; color: #0f172a; margin-bottom: 12px;">Service Details</div>
      ${serviceDetailsHtml}
    </div>
  `;

  return renderNotificationTemplate({
    title:
      data.audience === 'admin'
        ? `Booking Payment Received - ${serviceTitle}`
        : `Booking Payment Confirmed - ${serviceTitle}`,
    notificationMessage,
    sectionTitle: 'Booking details',
    details: [
      { label: 'Booking ID', value: data.bookingId },
      { label: 'Customer', value: data.customerName },
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
      { label: 'Booking Date', value: data.bookingDate },
      { label: 'Booking Time', value: data.bookingTime },
      ...(data.priority_status && data.service?.priority_fee
        ? [
            {
              label: 'Priority Fee',
              value: `R${Number(data.service.priority_fee).toFixed(2)}`,
            },
          ]
        : []),
      {
        label: 'Total Paid',
        value: `R${data.total.toFixed(2)}${data.priority_status && data.service?.priority_fee ? ' (includes Priority Fee)' : ''}`,
      },
      ...(data.transactionId
        ? [{ label: 'Transaction ID', value: data.transactionId }]
        : []),
      { label: 'Payment Status', value: 'Paid' },
      { label: 'Notes', value: data.notes || 'N/A' },
    ],
    customHtml,
    ctaLink:
      data.dashboardUrl ||
      data.detailsUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${data.bookingId}`,
    ctaText:
      data.audience === 'admin' ? 'Open Booking in Admin' : 'View My Booking',
    preheader:
      data.audience === 'admin'
        ? 'A booking payment has been received.'
        : 'Your booking payment has been completed.',
  });
}
