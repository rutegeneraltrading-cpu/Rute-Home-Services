import type { Metadata } from 'next';
import { NewProductPage } from '@/components/pages';
import { ADMIN_NEW_PRODUCT_METADATA } from '@/lib/seo';

export const metadata: Metadata = ADMIN_NEW_PRODUCT_METADATA;

const NewProduct = () => {
  return <NewProductPage />;
};

export default NewProduct;
