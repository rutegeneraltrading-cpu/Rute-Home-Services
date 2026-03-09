export interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  address: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_price: number;
  total_duration: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
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

export interface BookingPaymentData {
  booking_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  total_price: number;
  service_description: string;
}
