import { httpClient } from '@/lib/client/http/client';
import type {
  CreateBookingDTO,
  Booking,
  BookingPaymentData,
  UpdateBookingDTO,
  UserUpdateBookingDTO,
  AvailableWorker,
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
  const response = await httpClient.get<{ booking: Booking } | Booking>(
    `/api/bookings/${bookingId}`,
  );

  if ('booking' in response) {
    return response.booking;
  }

  return response;
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
  data: UpdateBookingDTO,
): Promise<Booking> => {
  const { booking } = await httpClient.patch<{ booking: Booking }>(
    `/api/bookings/${bookingId}`,
    data,
  );
  return booking;
};

export const getAvailableWorkersForBookingApi = async (
  bookingId: string,
): Promise<{
  workers: AvailableWorker[];
  assigned_worker_id: string | null;
  assignment_status: string | null;
}> => {
  return httpClient.get(`/api/bookings/${bookingId}/available-workers`);
};

/**
 * Cancel booking
 */
export const cancelBookingApi = async (bookingId: string): Promise<void> => {
  return httpClient.delete(`/api/bookings/${bookingId}`);
};

/**
 * Customer update booking (within 1-hour edit window)
 */
export const customerUpdateBookingApi = async (
  bookingId: string,
  data: UserUpdateBookingDTO,
): Promise<Booking> => {
  const { booking } = await httpClient.patch<{ booking: Booking }>(
    `/api/bookings/${bookingId}/customer-update`,
    data,
  );
  return booking;
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
