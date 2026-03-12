import { renderNotificationTemplate } from './renderNotificationTemplate';

export interface WorkerRatingReceivedEmailData {
  workerName: string;
  bookingId: string;
  serviceName: string;
  serviceCategory?: string;
  bookingDate?: string;
  bookingTime?: string;
  rating: number;
  review?: string;
}

function buildStars(rating: number): string {
  const safeRating = Math.min(5, Math.max(1, Math.floor(rating)));
  const filled = '★'.repeat(safeRating);
  const empty = '☆'.repeat(5 - safeRating);
  return `${filled}${empty}`;
}

export function workerRatingReceivedTemplate(
  data: WorkerRatingReceivedEmailData,
): string {
  const serviceTitle = data.serviceCategory
    ? `${data.serviceName} - ${data.serviceCategory}`
    : data.serviceName;

  const customHtml = `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-top:12px;">
      <div style="font-weight:700;color:#166534;margin-bottom:8px;font-size:16px;">Great job, ${data.workerName}!</div>
      <div style="font-size:14px;color:#14532d;line-height:1.5;">
        A customer submitted feedback for your recent booking.
      </div>
    </div>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-top:12px;text-align:center;">
      <div style="font-size:13px;color:#92400e;font-weight:600;margin-bottom:6px;">Customer Rating</div>
      <div style="font-size:30px;line-height:1;color:#f59e0b;letter-spacing:1px;">${buildStars(data.rating)}</div>
      <div style="font-size:14px;color:#78350f;margin-top:8px;">${data.rating} / 5</div>
    </div>

    ${
      data.review?.trim()
        ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-top:12px;"><div style="font-size:13px;color:#475569;font-weight:600;margin-bottom:8px;">Customer Review</div><div style="font-size:14px;color:#0f172a;line-height:1.6;">${data.review.trim()}</div></div>`
        : ''
    }
  `;

  return renderNotificationTemplate({
    title: `Great job! You received a ${data.rating}-star rating`,
    preheader: `Customer feedback received for booking ${data.bookingId}`,
    notificationMessage:
      'You have received new customer feedback. Keep up the excellent work and continue delivering great service.',
    sectionTitle: 'Booking details',
    details: [
      { label: 'Booking ID', value: data.bookingId },
      { label: 'Service', value: serviceTitle },
      { label: 'Date', value: data.bookingDate || 'N/A' },
      { label: 'Time', value: data.bookingTime || 'N/A' },
      { label: 'Rating', value: `${data.rating}/5` },
    ],
    customHtml,
    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    ctaText: 'Continue Great Service',
  });
}
