import { renderNotificationTemplate } from './renderNotificationTemplate';

interface OrderPaymentSuccessEmailData {
  audience: 'user' | 'admin';
  customerName: string;
  orderId: string;
  total: number;
  transactionId?: string | null;
  paidAt: string;
  detailsUrl: string;
}

export function orderPaymentSuccessTemplate(
  data: OrderPaymentSuccessEmailData,
): string {
  const notificationMessage =
    data.audience === 'admin'
      ? 'Order payment was completed successfully.'
      : 'Your order payment has been confirmed successfully.';

  return renderNotificationTemplate({
    title:
      data.audience === 'admin'
        ? 'Order payment received'
        : 'Payment successful',
    notificationMessage,
    sectionTitle: 'Payment details',
    details: [
      { label: 'Order ID', value: data.orderId },
      { label: 'Customer', value: data.customerName },
      { label: 'Total Paid', value: `R${data.total.toFixed(2)}` },
      { label: 'Transaction ID', value: data.transactionId || 'Not available' },
      { label: 'Paid At', value: data.paidAt },
      { label: 'Payment Status', value: 'Paid' },
    ],
    ctaLink: data.detailsUrl,
    ctaText:
      data.audience === 'admin' ? 'Open Order in Admin' : 'View My Order',
    preheader:
      data.audience === 'admin'
        ? 'A customer order payment has been received.'
        : 'Your order payment has been completed.',
  });
}
