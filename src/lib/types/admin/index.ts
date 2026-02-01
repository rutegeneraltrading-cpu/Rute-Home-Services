// Admin-specific types
import { BaseEntity } from './../common';

export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  is_active: boolean;
}

export interface Service extends BaseEntity {
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  duration_minutes: number;
  is_active: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Order extends BaseEntity {
  user_id: string;
  total_price: number;
  status: OrderStatus;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

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
