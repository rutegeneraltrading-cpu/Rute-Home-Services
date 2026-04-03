import { renderNotificationTemplate } from './renderNotificationTemplate';
import type { BookingUpdatedByCustomerEmailData } from '@/lib/types/email';

export function bookingUpdatedByCustomerTemplate(
  data: BookingUpdatedByCustomerEmailData,
): string {
  const isAdmin = data.audience === 'admin';
  const isMovingBooking =
    !!data.address &&
    data.address.includes('to=') &&
    data.address.includes('from=');
  const ratePerKm = Number(data.service?.base_price || 0);

  // Fee breakdown HTML
  let feeHtml = '';
  const service = data.service;
  if (
    typeof service?.platform_fee === 'number' ||
    (service?.options &&
      service.options.some((opt) => typeof opt.platform_fee === 'number'))
  ) {
    let total = 0;
    feeHtml = `<div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-top:12px;">
      <div style="font-size:13px;color:#0f172a;font-weight:600;margin-bottom:8px;">Platform Fee Breakdown</div>
      <table style="width:100%;font-size:14px;color:#334155;">
        <tbody>`;
    if (typeof service.platform_fee === 'number') {
      feeHtml += `<tr><td style="padding:4px 0;">Service Platform Fee</td><td style="padding:4px 0;text-align:right;">R ${service.platform_fee.toFixed(2)}</td></tr>`;
      total += service.platform_fee;
    }
    if (service.options && service.options.length > 0) {
      service.options.forEach((opt) => {
        if (typeof opt.platform_fee === 'number') {
          feeHtml += `<tr><td style="padding:4px 0;">Option: ${opt.name}</td><td style="padding:4px 0;text-align:right;">R ${opt.platform_fee.toFixed(2)}</td></tr>`;
          total += opt.platform_fee;
        }
      });
    }
    feeHtml += `<tr style="font-weight:700;"><td style="padding:4px 0;">Total Platform Fee</td><td style="padding:4px 0;text-align:right;">R ${total.toFixed(2)}</td></tr>`;
    feeHtml += `</tbody></table></div>`;
  }

  const customHtml = `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-top:12px;">
      <div style="font-weight:600;color:#0f172a;margin-bottom:12px;font-size:14px;">Current Booking Details</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#64748b;width:38%;vertical-align:top;">Service</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:500;color:#0f172a;vertical-align:top;">${data.service.name}${data.service.category ? ` <span style=\"color:#6b7280;font-size:12px;\">(${data.service.category})</span>` : ''}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#64748b;vertical-align:top;">Date &amp; Time</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:500;color:#0f172a;vertical-align:top;">${data.bookingDate} at ${data.bookingTime}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#64748b;vertical-align:top;">Address</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:500;color:#0f172a;vertical-align:top;">
            ${
              data.address &&
              data.address.includes('to=') &&
              data.address.includes('from=')
                ? (() => {
                    const params = new URLSearchParams(data.address);
                    const to = decodeURIComponent(params.get('to') || '');
                    const from = decodeURIComponent(params.get('from') || '');
                    return `<div><strong>From:</strong> ${from}</div><div><strong>To:</strong> ${to}</div>`;
                  })()
                : `${data.address || ''}${data.unitOrFlat ? `, ${data.unitOrFlat}` : ''}`
            }
          </td>
        </tr>
        ${
          isMovingBooking && ratePerKm > 0
            ? `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#64748b;vertical-align:top;">Pricing</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:500;color:#0f172a;vertical-align:top;">Distance-based (R${ratePerKm.toFixed(2)}/km)</td>
        </tr>`
            : ''
        }
        ${
          data.notes
            ? `<tr>
          <td style=\"padding:8px 0;font-size:13px;font-weight:600;color:#64748b;vertical-align:top;\">Notes</td>
          <td style=\"padding:8px 0;font-size:14px;color:#0f172a;vertical-align:top;\">${data.notes}</td>
        </tr>`
            : ''
        }
      </table>
    </div>
    ${feeHtml}
  `;

  const notificationMessage = isAdmin
    ? `Customer ${data.customerName} has updated their booking details.`
    : `The customer has made changes to your assigned booking.`;

  return renderNotificationTemplate({
    title: `Booking Updated by Customer`,
    notificationMessage,
    sectionTitle: 'Update summary',
    details: [
      { label: 'Booking ID', value: data.bookingId },
      { label: 'Customer', value: data.customerName },
      { label: isAdmin ? 'Recipient' : 'Worker', value: data.recipientName },
      { label: 'Updated At', value: data.updatedAt },
    ],
    ctaLink: isAdmin
      ? `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings/${data.bookingId}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/contact-us`,
    ctaText: isAdmin ? 'View Booking in Admin' : 'Contact Support',
    preheader: notificationMessage,
    customHtml,
  });
}
