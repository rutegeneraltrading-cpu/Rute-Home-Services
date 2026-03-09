import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createOrderApi,
  deleteOrderApi,
  getOrderPayFastPaymentUrlApi,
  updateOrderApi,
} from './orders.api';
import type {
  CreateOrderDTO,
  OrderPaymentData,
  UpdateOrderDTO,
} from '@/lib/types/orders';
import { orderKeys } from './orders.query';

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderDTO) => createOrderApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast.success('Order created successfully');
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      toast.error(error?.message || 'Failed to create order');
    },
  });
};

export const useOrderPayFastPayment = () => {
  return useMutation({
    mutationFn: (paymentData: OrderPaymentData) =>
      getOrderPayFastPaymentUrlApi(paymentData),
    onSuccess: (data) => {
      if (data?.payment_url) {
        window.location.href = data.payment_url;
      }
    },
    onError: (error) => {
      console.error('Error generating order payment URL:', error);
      toast.error(error?.message || 'Failed to initiate payment');
    },
  });
};

export const useUpdateOrder = (orderId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOrderDTO) => updateOrderApi(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      toast.success('Order updated successfully');
    },
    onError: (error) => {
      console.error('Error updating order:', error);
      toast.error(error?.message || 'Failed to update order');
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => deleteOrderApi(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast.success('Order deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting order:', error);
      toast.error(error?.message || 'Failed to delete order');
    },
  });
};
