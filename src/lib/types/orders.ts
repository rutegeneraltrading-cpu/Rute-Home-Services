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
  profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
  address?: {
    id: string;
    recipient_name?: string | null;
    phone?: string | null;
    line1: string;
    line2?: string | null;
    city: string;
    state_province: string;
    postal_code: string;
    country: string;
  };
}

export interface OrderDetailedItem extends OrderItemInput {
  line_total: number;
  product?: {
    id: string;
    name: string;
    sku?: string | null;
    brand?: string | null;
    price: number;
    sale_price?: number | null;
    stock?: number;
    images?: Array<{
      id: string;
      url: string;
      is_primary?: boolean | null;
      sort_order?: number | null;
    }>;
  } | null;
}

export interface OrderDetails extends Order {
  detailed_items: OrderDetailedItem[];
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

export interface UpdateOrderDTO {
  status?: OrderStatus;
  payment_status?: OrderPaymentStatus;
}
