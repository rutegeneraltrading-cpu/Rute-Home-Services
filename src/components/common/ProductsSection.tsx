'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useGetProducts } from '@/lib/client/api/products';
import type { Product } from '@/lib/client/api/products';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
const ProductsSection = () => {
  const { data: productsData = [], isLoading: productsLoading } =
    useGetProducts();

  const featuredProducts = useMemo(
    () => (productsData as Product[]).slice(0, 6),
    [productsData],
  );
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Featured Products
            </h2>
            <p className="text-slate-600">Top picks for your home</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/shop">View all</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(productsLoading ? Array.from({ length: 6 }) : featuredProducts).map(
            (product: any, index) => (
              <Card
                key={product?.id || index}
                className="h-full overflow-hidden"
              >
                <div className="relative h-44 bg-slate-100">
                  <Image
                    src={product?.images?.[0]?.url || '/image.png'}
                    alt={product?.name || 'Product'}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {product?.name || 'Loading...'}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {product?.description || 'Fetching product details...'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {product?.category?.name || 'Essentials'}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {product?.sale_price ? (
                      <>
                        <span className="text-xs text-slate-400 line-through">
                          R{product.price}
                        </span>
                        <span className="text-sm font-semibold text-green-700">
                          R{product.sale_price}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-green-700">
                        {product?.price ? `R${product.price}` : '—'}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
