import type { Metadata } from 'next';
import { ShopPage } from '@/components/pages';
import { SHOP_METADATA } from '@/lib/seo';

export const metadata: Metadata = SHOP_METADATA;

const Shop = () => {
  return <ShopPage />;
};

export default Shop;
