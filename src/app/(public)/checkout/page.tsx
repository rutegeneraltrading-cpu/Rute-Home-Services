import type { Metadata } from 'next';
import { CheckoutPage } from '@/components/pages';
import { CHECKOUT_METADATA } from '@/lib/seo';

export const metadata: Metadata = CHECKOUT_METADATA;

const Checkout = () => {
  return <CheckoutPage />;
};

export default Checkout;
