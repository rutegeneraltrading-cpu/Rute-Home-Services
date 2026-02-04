import { BaseEntity } from '../../common';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Booking extends BaseEntity {
  user_id: string;
  service_id: string;
  worker_id?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes?: string;
}
