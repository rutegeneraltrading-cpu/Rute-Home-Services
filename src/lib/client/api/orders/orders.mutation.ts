import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createOrderApi, getOrderPayFastPaymentUrlApi } from './orders.api';
import type { CreateOrderDTO, OrderPaymentData } from '@/lib/types/orders';
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
