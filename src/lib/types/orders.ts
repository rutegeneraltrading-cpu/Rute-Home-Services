import type { CreateUserAddressDTO } from '@/lib/types/user';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderPaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export interface OrderItemInput {
  product_id: string;
  quantity: number;
  price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  qty: number;
  unit_price: number;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItemInput[];
  address_id: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  payment_status: OrderPaymentStatus;
  payfast_transaction_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface CreateOrderDTO {
  items: OrderItemInput[];
  address_id?: string;
  new_address?: CreateUserAddressDTO;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
}

export interface OrderPaymentData {
  order_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  total: number;
}
