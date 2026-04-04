import type { Metadata } from 'next';
import { CartPage } from '@/components/pages';
import { CART_METADATA } from '@/lib/seo';

export const metadata: Metadata = CART_METADATA;

const Cart = () => {
  return <CartPage />;
};

export default Cart;
