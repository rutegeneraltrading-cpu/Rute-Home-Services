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
  full_booking_total?: number;
  serviceFeePercent?: number;
  priority_status?: boolean;
  priority_fee?: number;
  app_fee?: number;
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
  // totalAmount = per-worker earnings base (app_fee already excluded in route)
  const totalAmount = Number(data.totalAmount || 0);
  const appFee = Number(data.app_fee || 0);
  const workerBase = totalAmount;
  // full_booking_total = actual amount paid by customer (before dividing by worker count)
  const fullBookingTotal = Number(data.full_booking_total ?? totalAmount + appFee);
  const isMovingBooking =
    !!data.address &&
    data.address.includes('to=') &&
    data.address.includes('from=');
  const ratePerKm = Number(data.service?.base_price || 0);
  const selectedRequirements =
    data.service.requirements || data.service.variants || [];
  const requirementsTotal = selectedRequirements.reduce(
    (sum, req) => sum + Number(req?.price || 0),
    0,
  );
  const optionsPriceTotal = (data.service.options || []).reduce(
    (sum, opt) => sum + Number(opt?.price || 0),
    0,
  );
  const priorityFee = data.priority_status
    ? Number(data.service?.priority_fee || 0)
    : 0;
  const inferredDistanceCost = Math.max(
    0,
    workerBase - requirementsTotal - optionsPriceTotal - priorityFee,
  );
  const inferredDistanceKm =
    ratePerKm > 0 ? Number((inferredDistanceCost / ratePerKm).toFixed(1)) : 0;
  const damageDeductionPercent = 40;
  const maxDamageDeductionAmount = Number(
    ((workerBase * damageDeductionPercent) / 100).toFixed(2),
  );

  // Single platform fee applied on workerBase (excludes app_fee)
  const platformFeePercent = Math.max(
    0,
    Math.min(100, Number(data.service?.platform_fee || 0)),
  );
  const totalPlatformFeeAmount = Number(
    ((workerBase * platformFeePercent) / 100).toFixed(2),
  );
  const workerPayoutAmount = Number(
    (workerBase - totalPlatformFeeAmount).toFixed(2),
  );

  let serviceDetailsHtml = `
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.05em;">Service Details</p>
      <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#111827;">${data.service.name}</p>`;

  if (data.service.category) {
    serviceDetailsHtml += `<p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Category: ${data.service.category}</p>`;
  }

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
      if (data.address.includes('to=') && data.address.includes('from=')) {
        const params = new URLSearchParams(data.address);
        const to = decodeURIComponent(params.get('to') || '');
        const from = decodeURIComponent(params.get('from') || '');
        serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;"><strong>From:</strong> ${from}</p>`;
        serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;"><strong>To:</strong> ${to}</p>`;
      } else {
        serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Address: ${data.address}</p>`;
      }
    }

    if (data.unitOrFlat) {
      serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Unit / Flat: ${data.unitOrFlat}</p>`;
    }

    if (data.notes) {
      serviceDetailsHtml += `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Notes: ${data.notes}</p>`;
    }
  }

  if (totalAmount > 0) {
    serviceDetailsHtml += `<p style=\"margin:12px 0 6px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;\">Payment Breakdown</p>`;
    if (isMovingBooking && ratePerKm > 0) {
      serviceDetailsHtml += `<p style=\"margin:0 0 4px;font-size:13px;color:#374151;\">Rate per km: R${ratePerKm.toFixed(2)}</p>`;
      serviceDetailsHtml += `<p style=\"margin:0 0 4px;font-size:13px;color:#374151;\">Distance: ${inferredDistanceKm.toFixed(1)} km</p>`;
      serviceDetailsHtml += `<p style=\"margin:0 0 4px;font-size:13px;color:#374151;\">Distance Cost: R${inferredDistanceCost.toFixed(2)}</p>`;
    }
    if (data.priority_status && data.service?.priority_fee) {
      serviceDetailsHtml += `<p style=\"margin:0 0 4px;font-size:13px;color:#374151;\">Priority Fee: R${Number(data.service.priority_fee).toFixed(2)}</p>`;
    }
    serviceDetailsHtml += `<p style=\"margin:0 0 4px;font-size:13px;color:#374151;\">Total Booking (paid by customer): R${fullBookingTotal.toFixed(2)}</p>`;
    if (appFee > 0) {
      serviceDetailsHtml += `<p style=\"margin:0 0 4px;font-size:13px;color:#374151;\">App Fee (platform): R${appFee.toFixed(2)}</p>`;
      serviceDetailsHtml += `<p style=\"margin:0 0 4px;font-size:13px;color:#374151;\">Your Earnings Base: R${workerBase.toFixed(2)}</p>`;
    }
    serviceDetailsHtml += `<p style=\"margin:0 0 4px;font-size:13px;color:#374151;\">Damage Deduction: Only if damage occurs</p>`;
    serviceDetailsHtml += `<p style=\"margin:0 0 4px;font-size:13px;color:#374151;\">Max Deduction: R${maxDamageDeductionAmount.toFixed(2)} (${damageDeductionPercent}%)</p>`;
    serviceDetailsHtml += `<p style=\"margin:0 0 4px;font-size:13px;color:#374151;\">Platform Fee (${platformFeePercent.toFixed(2)}%): R${totalPlatformFeeAmount.toFixed(2)}</p>`;
    serviceDetailsHtml += `<p style=\"margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;\">Expected Payout: R${workerPayoutAmount.toFixed(2)}</p>`;
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
