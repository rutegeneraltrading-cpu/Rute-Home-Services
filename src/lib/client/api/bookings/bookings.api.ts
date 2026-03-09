import { httpClient } from '@/lib/client/http/client';
import type {
  CreateBookingDTO,
  Booking,
  BookingPaymentData,
} from '@/lib/types/bookings';

// ============================================
// BOOKINGS API
// ============================================

/**
 * Get all bookings for authenticated user
 */
export const getBookingsApi = async (): Promise<Booking[]> => {
  const { bookings } = await httpClient.get<{ bookings: Booking[] }>(
    '/api/bookings',
  );
  return bookings || [];
};

/**
 * Get single booking by ID
 */
export const getBookingApi = async (bookingId: string): Promise<Booking> => {
  return httpClient.get(`/api/bookings/${bookingId}`);
};

/**
 * Create new booking
 */
export const createBookingApi = async (
  data: CreateBookingDTO,
): Promise<Booking> => {
  const { booking } = await httpClient.post<{ booking: Booking }>(
    '/api/bookings',
    data,
  );
  return booking;
};

/**
 * Update booking
 */
export const updateBookingApi = async (
  bookingId: string,
  data: Partial<CreateBookingDTO>,
): Promise<Booking> => {
  const { booking } = await httpClient.put<{ booking: Booking }>(
    `/api/bookings/${bookingId}`,
    data,
  );
  return booking;
};

/**
 * Cancel booking
 */
export const cancelBookingApi = async (bookingId: string): Promise<void> => {
  return httpClient.delete(`/api/bookings/${bookingId}`);
};

// ============================================
// PAYMENT API
// ============================================

/**
 * Get PayFast payment redirect URL
 */
export const getPayFastPaymentUrlApi = async (
  paymentData: BookingPaymentData,
): Promise<{ payment_url: string }> => {
  return httpClient.post('/api/payments/payfast/redirect', paymentData);
};
