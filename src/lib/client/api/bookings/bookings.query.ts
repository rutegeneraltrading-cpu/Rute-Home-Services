import { useQuery } from '@tanstack/react-query';
import { getBookingsApi, getBookingApi } from './bookings.api';

// ============================================
// QUERY KEYS
// ============================================

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
};

// ============================================
// BOOKING QUERIES
// ============================================

/**
 * Get all bookings for authenticated user
 */
export const useGetBookings = () => {
  return useQuery({
    queryKey: bookingKeys.lists(),
    queryFn: getBookingsApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get single booking by ID
 */
export const useGetBooking = (bookingId: string) => {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId),
    queryFn: () => getBookingApi(bookingId),
    enabled: !!bookingId,
    staleTime: 5 * 60 * 1000,
  });
};
