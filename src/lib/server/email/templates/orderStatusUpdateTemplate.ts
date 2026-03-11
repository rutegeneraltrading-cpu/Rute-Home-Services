import { renderNotificationTemplate } from './renderNotificationTemplate';

interface OrderStatusUpdateEmailData {
  customerName: string;
  orderId: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: string;
  detailsUrl: string;
}

export function orderStatusUpdateTemplate(data: OrderStatusUpdateEmailData) {
  return renderNotificationTemplate({
    title: 'Order status updated',
    notificationMessage: `Your order status changed from ${data.previousStatus} to ${data.newStatus}.`,
    sectionTitle: 'Order tracking update',
    details: [
      { label: 'Order ID', value: data.orderId },
      { label: 'Customer', value: data.customerName },
      { label: 'Previous Status', value: data.previousStatus },
      { label: 'Current Status', value: data.newStatus },
      { label: 'Updated At', value: data.updatedAt },
    ],
    ctaLink: data.detailsUrl,
    ctaText: 'Track Order',
    preheader: 'Your order status has been updated.',
  });
}
