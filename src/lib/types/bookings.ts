// Assignment for a worker on a booking
export interface BookingAssignment {
  worker_id: string;
  status: BookingAssignmentStatus;
  worker_name?: string;
  worker_email?: string;
}
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

export interface BookingSelectionDetail {
  id: string;
  name: string;
}

export interface BookingServiceCategoryDetail {
  id: string;
  name: string;
  slug?: string | null;
  charge_type?: string | null;
  is_active?: boolean | null;
}

export interface BookingServiceDetail {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  base_price?: number | null;
  priority_fee?: number | null;
  duration_minutes?: number | null;
  is_active?: boolean | null;
  category?: BookingServiceCategoryDetail | null;
}

export interface BookingOptionDetail extends BookingSelectionDetail {
  service_id?: string;
  description?: string | null;
  type?: string | null;
  price?: number | null;
  duration_minutes?: number | null;
  is_required?: boolean | null;
  display_order?: number | null;
  is_active?: boolean | null;
}

export interface BookingVariantDetail extends BookingSelectionDetail {
  service_option_id?: string;
  service_option_name?: string | null;
  type?: string | null;
  price?: number | null;
  duration_minutes?: number | null;
  display_order?: number | null;
  is_active?: boolean | null;
}

export interface Booking {
  service_platform_fee_percentage?: number;
  service_platform_fee_amount?: number;
  options_platform_fee_percentage?: number;
  options_platform_fee_amount?: number;
  total_platform_fee_amount?: number;
  id: string;
  user_id: string;
  service_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  service_name?: string;
  service_category?: string;
  assignments?: BookingAssignment[];
  rating_value?: number | null;
  rating_review?: string | null;
  rating_submitted_at?: string | null;
  address: string;
  unit_or_flat?: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  total_price: number;
  service_fee_percentage?: number | null;
  service_fee_amount?: number | null;
  worker_payout_amount?: number | null;
  total_duration: number;
  payment_status: BookingPaymentStatus;
  payfast_transaction_id?: string;
  selected_options: string[]; // option IDs
  selected_variants: string[]; // variant IDs
  service_details?: BookingServiceDetail;
  selected_option_details?: BookingOptionDetail[];
  selected_variant_details?: BookingVariantDetail[];
  notes?: string;
  created_at: string;
  updated_at: string;
  priority_status?: boolean;
  priority_fee?: number;
  insurance?: boolean;
  additional_works?: BookingAdditionalWork[];
}

export interface CreateBookingDTO {
  user_id: string;
  service_id: string;
  address: string;
  unit_or_flat?: string;
  booking_date: string;
  booking_time: string;
  total_price: number;
  total_duration: number;
  selected_options?: string[];
  selected_variants?: string[];
  notes?: string;
  priority_status?: boolean;
  priority_fee?: number;
  app_fee?: number;
  insurance?: boolean;
}

export interface UpdateBookingDTO {
  status?: BookingStatus;
  payment_status?: BookingPaymentStatus;
  worker_id?: string | null;
  auto_assign?: boolean;
  assignment_status?: BookingAssignmentStatus;
  assignments?: { worker_id: string; status: BookingAssignmentStatus }[];
}

export interface UserUpdateBookingDTO {
  notes?: string;
  address?: string;
  unit_or_flat?: string;
  booking_date?: string;
  booking_time?: string;
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

export type AdditionalWorkStatus = 'pending_payment' | 'paid' | 'cancelled';

export interface BookingAdditionalWork {
  id: string;
  booking_id: string;
  description: string;
  fee: number;
  status: AdditionalWorkStatus;
  payfast_transaction_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAdditionalWorkDTO {
  description: string;
  fee: number;
}

export interface AdditionalWorkPaymentData {
  additional_work_id: string;
  booking_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  fee: number;
  description: string;
}
