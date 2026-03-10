export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type BookingPaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type BookingAssignmentStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  customer_name?: string;
  customer_email?: string;
  service_name?: string;
  service_category?: string;
  assigned_worker_id?: string;
  assigned_worker_name?: string;
  assigned_worker_email?: string;
  assignment_status?: BookingAssignmentStatus;
  address: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  total_price: number;
  total_duration: number;
  payment_status: BookingPaymentStatus;
  payfast_transaction_id?: string;
  selected_options: string[]; // option IDs
  selected_variants: string[]; // variant IDs
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingDTO {
  user_id: string;
  service_id: string;
  address: string;
  booking_date: string;
  booking_time: string;
  total_price: number;
  total_duration: number;
  selected_options?: string[]; // option IDs
  selected_variants?: string[]; // variant IDs
  notes?: string;
}

export interface UpdateBookingDTO {
  status?: BookingStatus;
  payment_status?: BookingPaymentStatus;
  worker_id?: string | null;
  auto_assign?: boolean;
  assignment_status?: BookingAssignmentStatus;
}

export interface AvailableWorker {
  worker_id: string;
  profile_id: string;
  full_name: string;
  phone: string | null;
  rating_avg: number | null;
}

export interface BookingPaymentData {
  booking_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  total_price: number;
  service_name: string;
  service_description: string;
}
