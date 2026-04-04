import type { Metadata } from 'next';
import { SingleProductsPage } from '@/components/pages';
import { buildMetadata } from '@/lib/seo';
import { createAdminClient } from '@/lib/supabase';

type ProductMeta = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  brand: string | null;
  stock: number;
  images?: Array<{
    url: string;
    sort_order: number | null;
    is_primary: boolean | null;
  }>;
};

const getPrimaryImage = (
  images?: ProductMeta['images'],
): string | undefined => {
  if (!images?.length) return undefined;

  const primary = images.find((image) => image.is_primary);
  const ordered = [...images].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
  );

  return primary?.url || ordered[0]?.url;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const supabase = await createAdminClient();
    const { data: product } = await supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        description,
        price,
        sale_price,
        brand,
        stock,
        images:product_images(url, sort_order, is_primary)
      `,
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .single<ProductMeta>();

    if (!product) {
      return buildMetadata({
        title: 'Product Not Found',
        description: 'The product you are looking for does not exist.',
        path: `/shop/${slug}`,
        noIndex: true,
      });
    }

    const currentPrice = product.sale_price || product.price;
    const title = `${product.name} | Rute Shop`;
    const description =
      product.description ||
      `${product.name}${product.brand ? ` by ${product.brand}` : ''} available on Rute. Shop quality home products online.`;
    const image = getPrimaryImage(product.images);

    return buildMetadata({
      title,
      description,
      keywords: [
        product.name,
        product.brand || '',
        'Rute shop',
        'buy home products online',
        'home maintenance tools',
        'South Africa',
      ].filter(Boolean),
      path: `/shop/${product.slug || slug}`,
      image,
      openGraph: {
        title,
        description: `${description} Price: R${Number(currentPrice).toFixed(2)}.`,
        image,
      },
      twitter: {
        title,
        description: `${description} Price: R${Number(currentPrice).toFixed(2)}.`,
        image,
      },
    });
  } catch {
    return buildMetadata({
      title: 'Product',
      description: 'Explore this product on Rute shop.',
      path: `/shop/${slug}`,
    });
  }
}

const SingleProduct = () => {
  return <SingleProductsPage />;
};

export default SingleProduct;
