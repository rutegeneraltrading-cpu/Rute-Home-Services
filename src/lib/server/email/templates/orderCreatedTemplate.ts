import { renderNotificationTemplate } from './renderNotificationTemplate';

interface OrderCreatedEmailData {
  customerName: string;
  orderId: string;
  itemsCount: number;
  total: number;
  paymentStatus: string;
  dashboardUrl: string;
}

export function orderCreatedTemplate(data: OrderCreatedEmailData): string {
  return renderNotificationTemplate({
    title: 'Order created successfully',
    notificationMessage:
      'Your order has been placed and is now pending payment.',
    sectionTitle: 'Order details',
    details: [
      { label: 'Order ID', value: data.orderId },
      { label: 'Customer', value: data.customerName },
      { label: 'Items', value: String(data.itemsCount) },
      { label: 'Total', value: `R${data.total.toFixed(2)}` },
      { label: 'Payment Status', value: data.paymentStatus },
    ],
    ctaLink: data.dashboardUrl,
    ctaText: 'View Order',
    preheader: 'Your order was created successfully.',
  });
}
