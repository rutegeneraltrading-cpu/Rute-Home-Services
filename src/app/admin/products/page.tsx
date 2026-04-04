import type { Metadata } from 'next';
import { ProductsPage } from '@/components/pages';
import { ADMIN_PRODUCTS_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_PRODUCTS_METADATA;

const Products = () => {
  return <ProductsPage />;
};

export default Products;
