import { renderNotificationTemplate } from './renderNotificationTemplate';
import type { OrderStatusUpdateEmailData } from '@/lib/types/email';

const MAX_TITLE_LENGTH = 70;

function cleanProductNameForHeading(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '');
}

function buildProductsTitle(items: Array<{ productName: string }>): string {
  const uniqueNames = Array.from(
    new Set(items.map((item) => cleanProductNameForHeading(item.productName))),
  );
  const title = uniqueNames.join(', ');
  return title.length > MAX_TITLE_LENGTH
    ? title.substring(0, MAX_TITLE_LENGTH - 3) + '...'
    : title;
}

export function orderStatusUpdateTemplate(data: OrderStatusUpdateEmailData) {
  const productsTitle = buildProductsTitle(data.items);

  const itemsList = data.items
    .map((item) => {
      const itemTotal = item.price * item.quantity;
      const category = item.category ? ` (${item.category})` : '';
      const imageHtml = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${item.productName}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 4px;" />`
        : `<div style="width: 56px; height: 56px; background-color: #d1d5db; border-radius: 4px;"></div>`;

      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; vertical-align: middle;">
            ${imageHtml}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">
            <div style="font-weight: 500; color: #1f2937; margin-bottom: 4px;">
              ${item.productName}${category}
            </div>
            <div style="color: #6b7280; font-size: 13px;">
              ${item.quantity}x R${item.price.toFixed(2)} = R${itemTotal.toFixed(2)}
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  const itemsDetailsHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; font-size: 14px;">
      ${itemsList}
    </table>
  `;

  return renderNotificationTemplate({
    title: `Order status: ${productsTitle}`,
    notificationMessage: `Your order status changed from ${data.previousStatus} to ${data.newStatus}.`,
    sectionTitle: 'Order tracking update',
    details: [
      { label: 'Order ID', value: data.orderId },
      { label: 'Customer', value: data.customerName },
      { label: 'Number of Items', value: String(data.items.length) },
      { label: 'Previous Status', value: data.previousStatus },
      { label: 'Current Status', value: data.newStatus },
      { label: 'Updated At', value: data.updatedAt },
    ],
    customHtml: itemsDetailsHtml,
    ctaLink: data.detailsUrl,
    ctaText: 'Track Order',
    preheader: 'Your order status has been updated.',
  });
}
