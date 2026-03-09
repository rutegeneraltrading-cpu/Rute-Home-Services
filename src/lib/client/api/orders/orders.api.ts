import { httpClient } from '@/lib/client/http/client';
import type {
  CreateOrderDTO,
  Order,
  OrderPaymentData,
} from '@/lib/types/orders';

export const getOrdersApi = async (): Promise<Order[]> => {
  const { orders } = await httpClient.get<{ orders: Order[] }>('/api/orders');
  return orders || [];
};

export const getOrderApi = async (orderId: string): Promise<Order> => {
  return httpClient.get(`/api/orders/${orderId}`);
};

export const createOrderApi = async (data: CreateOrderDTO): Promise<Order> => {
  const { order } = await httpClient.post<{ order: Order }>(
    '/api/orders',
    data,
  );
  return order;
};

export const getOrderPayFastPaymentUrlApi = async (
  paymentData: OrderPaymentData,
): Promise<{ payment_url: string }> => {
  return httpClient.post('/api/payments/payfast/order-redirect', paymentData);
};
