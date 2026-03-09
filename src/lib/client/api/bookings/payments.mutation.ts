import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getPayFastPaymentUrlApi } from './bookings.api';
import type { BookingPaymentData } from '@/lib/types/bookings';

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
        // Redirect to PayFast PayWeb
        window.location.href = data.payment_url;
      }
    },
    onError: (error) => {
      console.error('Error generating payment URL:', error);
      toast.error(error?.message || 'Failed to initiate payment');
    },
  });
};
