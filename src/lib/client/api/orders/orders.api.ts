import { httpClient } from '@/lib/client/http/client';
import type {
  CreateOrderDTO,
  Order,
  OrderDetails,
  OrderPaymentData,
  UpdateOrderDTO,
} from '@/lib/types/orders';

export const getOrdersApi = async (): Promise<Order[]> => {
  const { orders } = await httpClient.get<{ orders: Order[] }>('/api/orders');
  return orders || [];
};

export const getOrderApi = async (orderId: string): Promise<OrderDetails> => {
  const response = await httpClient.get<{ order: OrderDetails } | OrderDetails>(
    `/api/orders/${orderId}`,
  );

  if ('order' in response) {
    return response.order;
  }

  return response;
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

export const updateOrderApi = async (
  orderId: string,
  data: UpdateOrderDTO,
): Promise<Order> => {
  const { order } = await httpClient.patch<{ order: Order }>(
    `/api/orders/${orderId}`,
    data,
  );
  return order;
};

export const deleteOrderApi = async (orderId: string): Promise<void> => {
  await httpClient.delete(`/api/orders/${orderId}`);
};
