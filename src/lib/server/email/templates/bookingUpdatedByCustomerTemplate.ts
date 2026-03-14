import { renderNotificationTemplate } from './renderNotificationTemplate';
import type { BookingUpdatedByCustomerEmailData } from '@/lib/types/email';

export function bookingUpdatedByCustomerTemplate(
  data: BookingUpdatedByCustomerEmailData,
): string {
  const isAdmin = data.audience === 'admin';

  const customHtml = `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-top:12px;">
      <div style="font-weight:600;color:#0f172a;margin-bottom:12px;font-size:14px;">Current Booking Details</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#64748b;width:38%;vertical-align:top;">Service</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:500;color:#0f172a;vertical-align:top;">${data.service.name}${data.service.category ? ` <span style="color:#6b7280;font-size:12px;">(${data.service.category})</span>` : ''}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#64748b;vertical-align:top;">Date &amp; Time</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:500;color:#0f172a;vertical-align:top;">${data.bookingDate} at ${data.bookingTime}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#64748b;vertical-align:top;">Address</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:500;color:#0f172a;vertical-align:top;">${data.address}${data.unitOrFlat ? `, ${data.unitOrFlat}` : ''}</td>
        </tr>
        ${
          data.notes
            ? `<tr>
          <td style="padding:8px 0;font-size:13px;font-weight:600;color:#64748b;vertical-align:top;">Notes</td>
          <td style="padding:8px 0;font-size:14px;color:#0f172a;vertical-align:top;">${data.notes}</td>
        </tr>`
            : ''
        }
      </table>
    </div>
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
