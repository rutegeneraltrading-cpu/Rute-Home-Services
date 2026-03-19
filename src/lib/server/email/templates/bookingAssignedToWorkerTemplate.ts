import type { BookingServiceDetail } from '@/lib/types/email';
import { renderNotificationTemplate } from './renderNotificationTemplate';

interface BookingAssignedToWorkerEmailData {
  workerName: string;
  bookingId: string;
  service: BookingServiceDetail;
  address?: string;
  unitOrFlat?: string;
  notes?: string;
  bookingDate: string;
  bookingTime: string;
  customerName: string;
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

export function bookingAssignedToWorkerTemplate(
  data: BookingAssignedToWorkerEmailData,
) {
  const totalAmount = Number(data.totalAmount || 0);
  const damageDeductionPercent = 40;
  const maxDamageDeductionAmount = Number(
    ((totalAmount * damageDeductionPercent) / 100).toFixed(2),
  );

  // Calculate platform_fee for service
  const servicePlatformFeePercent = Math.max(
    0,
    Math.min(100, Number(data.service?.platform_fee || 0)),
  );
  const servicePlatformFeeAmount = Number(
    ((totalAmount * servicePlatformFeePercent) / 100).toFixed(2),
  );

  // Calculate platform_fee for options
  const options = Array.isArray(data.service.options)
    ? data.service.options
    : [];
  const optionsPlatformFeePercent = options.reduce(
    (sum, opt) => sum + Number(opt.platform_fee || 0),
    0,
  );
  const optionsPlatformFeeAmount = Number(
    ((totalAmount * optionsPlatformFeePercent) / 100).toFixed(2),
  );

  const totalPlatformFeeAmount = Number(
    (servicePlatformFeeAmount + optionsPlatformFeeAmount).toFixed(2),
  );
  const workerPayoutAmount = Number(
    (totalAmount - totalPlatformFeeAmount).toFixed(2),
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
    serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Service Platform Fee (${servicePlatformFeePercent.toFixed(2)}%): R${servicePlatformFeeAmount.toFixed(2)}</p>`;
    serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Options Platform Fee (${optionsPlatformFeePercent.toFixed(2)}%): R${optionsPlatformFeeAmount.toFixed(2)}</p>`;
    serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;font-weight:700;">Total Platform Fee: R${totalPlatformFeeAmount.toFixed(2)}</p>`;
    serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;">Expected Payout: R${workerPayoutAmount.toFixed(2)}</p>`;
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
