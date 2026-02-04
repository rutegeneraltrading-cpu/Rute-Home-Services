// Admin-specific types
import { BaseEntity } from '../../common';

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
