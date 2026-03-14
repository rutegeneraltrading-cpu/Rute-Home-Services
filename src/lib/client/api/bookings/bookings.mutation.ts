import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createBookingApi,
  cancelBookingApi,
  updateBookingApi,
  customerUpdateBookingApi,
} from './bookings.api';
import type {
  CreateBookingDTO,
  UpdateBookingDTO,
  UserUpdateBookingDTO,
} from '@/lib/types/bookings';
import { bookingKeys } from './bookings.query';

// ============================================
// BOOKING MUTATIONS
// ============================================

/**
 * Create new booking
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingDTO) => createBookingApi(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast.success('Booking created successfully!');
      return data;
    },
    onError: (error) => {
      console.error('Error creating booking:', error);
      toast.error(error?.message || 'Failed to create booking');
    },
  });
};

/**
 * Update booking
 */
export const useUpdateBooking = (bookingId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBookingDTO) => updateBookingApi(bookingId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(bookingId),
      });
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast.success('Booking updated successfully!');
      return data;
    },
    onError: (error) => {
      console.error('Error updating booking:', error);
      toast.error(error?.message || 'Failed to update booking');
    },
  });
};

/**
 * Cancel booking
 */
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => cancelBookingApi(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast.success('Booking cancelled successfully!');
    },
    onError: (error) => {
      console.error('Error cancelling booking:', error);
      toast.error(error?.message || 'Failed to cancel booking');
    },
  });
};

/**
 * Customer update booking (within 1-hour edit window)
 */
export const useCustomerUpdateBooking = (bookingId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserUpdateBookingDTO) =>
      customerUpdateBookingApi(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(bookingId),
      });
      toast.success('Booking updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating booking:', error);
      toast.error(error?.message || 'Failed to update booking');
    },
  });
};
