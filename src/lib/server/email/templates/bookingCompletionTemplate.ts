import { renderNotificationTemplate } from './renderNotificationTemplate';

export interface BookingCompletionEmailData {
  userEmail: string;
  userName: string;
  bookingId: string;
  serviceName: string;
  serviceCategory: string;
  bookingDate: string;
  bookingTime: string;
  workerName: string;
  workerImage?: string;
  ratingLink: string;
  payoutAmount?: number;
}

export async function bookingCompletionTemplate(
  data: BookingCompletionEmailData,
): Promise<string> {
  const workerImageHtml = data.workerImage
    ? `<img src="${data.workerImage}" alt="${data.workerName}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;" />`
    : '<div style="width: 80px; height: 80px; border-radius: 50%; background: #e0e0e0; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center;"><span style="color: #999; font-size: 32px;">👤</span></div>';

  const starsHtml = [1, 2, 3, 4, 5]
    .map((star) => {
      const separator = data.ratingLink.includes('?') ? '&' : '?';
      return `<a class="rating-star" href="${data.ratingLink}${separator}rating=${star}" style="text-decoration: none; font-size: 34px; color: #e0e0e0; display: inline-block; padding: 0 3px;">★</a>`;
    })
    .join('');

  const customHTML =
    `<table style="width: 100%; margin: 20px 0;"><tr><td style="padding: 15px; background: #f8f9fa; border-radius: 8px;">` +
    `<p style="margin: 0 0 10px 0; font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600;">Service Details</p>` +
    `<p style="margin: 5px 0; font-size: 14px; color: #1a1a1a;"><strong>${data.serviceName}</strong> (${data.serviceCategory})</p>` +
    `<p style="margin: 5px 0; font-size: 14px; color: #666;">📅 ${data.bookingDate} at ${data.bookingTime}</p></td></tr></table>` +
    `<table style="width: 100%; margin: 20px 0;"><tr><td style="text-align: center; padding: 15px;">` +
    `${workerImageHtml}` +
    `<p style="margin: 10px 0 5px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">Your Professional</p>` +
    `<p style="margin: 0; font-size: 14px; color: #666;">${data.workerName}</p></td></tr></table>` +
    `<div style="text-align: center; margin: 30px 0;">` +
    `<style>` +
    `.rating-stars { display: inline-block; }` +
    `.rating-stars .rating-star { color: #e0e0e0 !important; }` +
    `.rating-stars .rating-star:hover, .rating-stars .rating-star:hover ~ .rating-star { color: #f59e0b !important; }` +
    `</style>` +
    `<p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">How was your experience with ${data.workerName}?</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 20px;"><tr><td align="center"><div class="rating-stars">${starsHtml}</div></td></tr></table>` +
    `<p style="margin: 0; font-size: 13px; color: #666;">Click stars to rate your professional</p></div>` +
    `<p style="margin: 20px 0; padding: 15px; background: #e8f5e9; border-left: 4px solid #4caf50; color: #2e7d32; font-size: 14px; border-radius: 4px;">` +
    `Your feedback helps us maintain quality and recognize our best professionals</p>`;

  const detailsArr = [
    { label: 'Professional', value: data.workerName },
    {
      label: 'Service',
      value: `${data.serviceName} (${data.serviceCategory})`,
    },
    {
      label: 'Date & Time',
      value: `${data.bookingDate} at ${data.bookingTime}`,
    },
  ];
  if (typeof data.payoutAmount === 'number') {
    detailsArr.push({
      label: 'Your Payout',
      value: `Rs. ${data.payoutAmount}`,
    });
  }
  return renderNotificationTemplate({
    title: 'Booking Complete - Rate Your Professional',
    preheader: `Thank you! Tell us about your experience with ${data.workerName}`,
    notificationMessage: `Your booking for ${data.serviceName} has been completed successfully. We'd love to know how it went!`,
    sectionTitle: 'Service Details',
    details: detailsArr,
    customHtml: customHTML,
    ctaText: 'Rate Your Experience',
    ctaLink: data.ratingLink,
  });
}
