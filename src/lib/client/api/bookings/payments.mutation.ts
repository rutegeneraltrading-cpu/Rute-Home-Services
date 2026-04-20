import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getPayFastPaymentUrlApi,
  createAdditionalWorkApi,
  retryAdditionalWorkPaymentApi,
} from './bookings.api';
import type {
  BookingPaymentData,
  CreateAdditionalWorkDTO,
} from '@/lib/types/bookings';
import { bookingKeys } from './bookings.query';

// ============================================
// PAYMENT MUTATIONS
// ============================================

/**
 * Get PayFast payment URL and redirect to PayWeb
 */
export const usePayFastPayment = () => {
  return useMutation({
    mutationFn: (paymentData: BookingPaymentData) =>
      getPayFastPaymentUrlApi(paymentData),
    onSuccess: (data) => {
      if (data?.payment_url) {
        window.location.href = data.payment_url;
      }
    },
    onError: (error) => {
      console.error('Error generating payment URL:', error);
      toast.error(error?.message || 'Failed to initiate payment');
    },
  });
};

/**
 * Create additional work and redirect to PayFast
 */
export const useCreateAdditionalWork = (bookingId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdditionalWorkDTO) =>
      createAdditionalWorkApi(bookingId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: bookingKeys.additionalWorks(bookingId),
      });
      if (data?.payment_url) {
        window.location.href = data.payment_url;
      }
    },
    onError: (error) => {
      console.error('Error creating additional work:', error);
      toast.error(error?.message || 'Failed to initiate additional work payment');
    },
  });
};

/**
 * Retry payment for an existing pending_payment additional work
 */
export const useRetryAdditionalWorkPayment = (bookingId: string) => {
  return useMutation({
    mutationFn: (awId: string) => retryAdditionalWorkPaymentApi(bookingId, awId),
    onSuccess: (data) => {
      if (data?.payment_url) {
        window.location.href = data.payment_url;
      }
    },
    onError: (error) => {
      console.error('Error retrying additional work payment:', error);
      toast.error(error?.message || 'Failed to initiate payment');
    },
  });
};
