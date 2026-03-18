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
  address?: string;
  unitOrFlat?: string;
  notes?: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount?: number;
  serviceFeePercent?: number;
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

export function bookingAssignmentCancelledTemplate(
  data: BookingAssignmentCancelledEmailData,
) {
  const totalAmount = Number(data.totalAmount || 0);
  const damageDeductionPercent = 40;
  const maxDamageDeductionAmount = Number(
    ((totalAmount * damageDeductionPercent) / 100).toFixed(2),
  );
  const serviceFeePercent = Math.max(
    0,
    Math.min(100, Number(data.serviceFeePercent || 0)),
  );
  const serviceFeeAmount = Number(
    ((totalAmount * serviceFeePercent) / 100).toFixed(2),
  );
  const workerPayoutAmount = Number(
    (totalAmount - serviceFeeAmount).toFixed(2),
  );

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

  const selectedRequirements =
    data.service.requirements || data.service.variants;

  if (selectedRequirements && selectedRequirements.length > 0) {
    serviceDetailsHtml += `<p style="margin:12px 0 6px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Details</p><ul style="margin:0;padding-left:18px;">`;
    for (const requirement of selectedRequirements) {
      serviceDetailsHtml += `<li style="font-size:13px;color:#374151;margin-bottom:4px;">${requirement.name}${requirement.type ? ` (${formatRequirementType(requirement.type)})` : ''}${typeof requirement.price === 'number' ? ` — R${requirement.price}` : ''}</li>`;
    }
    serviceDetailsHtml += `</ul>`;
  }

  if (data.service.options && data.service.options.length > 0) {
    serviceDetailsHtml += `<p style="margin:12px 0 6px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Selected Options</p><ul style="margin:0;padding-left:18px;">`;
    for (const opt of data.service.options) {
      serviceDetailsHtml += `<li style="font-size:13px;color:#374151;margin-bottom:4px;">${opt.name}${opt.price ? ` — R${opt.price}` : ''}${opt.description ? ` <span style="color:#6b7280;">(${opt.description})</span>` : ''}</li>`;
    }
    serviceDetailsHtml += `</ul>`;
  }

  if (data.address || data.unitOrFlat || data.notes) {
    serviceDetailsHtml += `<p style="margin:12px 0 6px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Booking Info</p>`;

    if (data.address) {
      serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Address: ${data.address}</p>`;
    }

    if (data.unitOrFlat) {
      serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Unit / Flat: ${data.unitOrFlat}</p>`;
    }

    if (data.notes) {
      serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Notes: ${data.notes}</p>`;
    }
  }

  if (totalAmount > 0) {
    serviceDetailsHtml += `<p style="margin:12px 0 6px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Payment Breakdown</p>`;
    serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Total Booking: R${totalAmount.toFixed(2)}</p>`;
    serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Damage Deduction: Only if damage occurs</p>`;
    serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Max Deduction: R${maxDamageDeductionAmount.toFixed(2)} (${damageDeductionPercent}%)</p>`;
    serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Service Fee (${serviceFeePercent.toFixed(2)}%): R${serviceFeeAmount.toFixed(2)}</p>`;
    serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;">Expected Payout: R${workerPayoutAmount.toFixed(2)}</p>`;
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
