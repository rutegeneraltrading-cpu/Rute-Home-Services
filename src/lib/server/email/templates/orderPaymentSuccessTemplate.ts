import { renderNotificationTemplate } from './renderNotificationTemplate';
import type { OrderPaymentSuccessEmailData } from '@/lib/types/email';

const MAX_TITLE_LENGTH = 70;

function cleanProductNameForHeading(name: string): string {
  return String(name || '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .trim();
}

function buildProductsTitle(
  items: OrderPaymentSuccessEmailData['items'],
): string {
  const products = Array.from(
    new Set(
      items
        .map((item) => cleanProductNameForHeading(item.productName))
        .filter(Boolean),
    ),
  );
  const joined = products.join(', ') || 'Your Products';

  if (joined.length <= MAX_TITLE_LENGTH) return joined;
  return `${joined.slice(0, MAX_TITLE_LENGTH - 3).trimEnd()}...`;
}

export function orderPaymentSuccessTemplate(
  data: OrderPaymentSuccessEmailData,
): string {
  const productsTitle = buildProductsTitle(data.items);

  const notificationMessage =
    data.audience === 'admin'
      ? 'Order payment was completed successfully.'
      : 'Your order payment has been confirmed successfully.';

  const itemsList = data.items
    .map((item) => {
      const itemTotal = item.price * item.quantity;
      const category = item.category ? ` (${item.category})` : '';
      const imageHtml = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="" style="width:56px;height:56px;border-radius:8px;object-fit:cover;border:1px solid #e5e7eb;display:block;" />`
        : `<div style="width:56px;height:56px;border-radius:8px;background:#f3f4f6;border:1px solid #e5e7eb;"></div>`;

      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td width="68" valign="top" style="padding-right:12px;">${imageHtml}</td>
                <td valign="top">
                  <div style="font-weight: 500; color: #1f2937; margin-bottom: 4px;">
                    ${item.productName}${category}
                  </div>
                  <div style="color: #6b7280; font-size: 13px;">
                    ${item.quantity}x R${item.price.toFixed(2)} = R${itemTotal.toFixed(2)}
                  </div>
                </td>
              </tr>
            </table>
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
    title: productsTitle,
    notificationMessage,
    sectionTitle: 'Order summary',
    details: [
      { label: 'Order ID', value: data.orderId },
      { label: 'Customer', value: data.customerName },
      { label: 'Number of Items', value: String(data.items.length) },
      { label: 'Total Paid', value: `R${data.total.toFixed(2)}` },
      ...(data.transactionId
        ? [{ label: 'PayFast Transaction ID', value: data.transactionId }]
        : []),
      { label: 'Payment Status', value: 'Paid' },
    ],
    customHtml: itemsDetailsHtml,
    ctaLink: data.dashboardUrl,
    ctaText:
      data.audience === 'admin' ? 'Open Order in Admin' : 'View My Order',
    preheader:
      data.audience === 'admin'
        ? 'A customer order payment has been received.'
        : 'Your order payment has been completed.',
  });
}
