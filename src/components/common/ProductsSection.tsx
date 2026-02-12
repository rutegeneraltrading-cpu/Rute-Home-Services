'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import { useGetProducts } from '@/lib/client/api/products';
import type { Product } from '@/lib/client/api/products';
import { Button } from '@/components/ui';
import { ProductCard } from '@/components/common';
import { useCart } from '@/lib/contexts';

const ProductsSection = () => {
  const { data: productsData = [], isLoading: productsLoading } =
    useGetProducts();
  const { addItem } = useCart();

  const featuredProducts = useMemo(
    () => (productsData as Product[]).slice(0, 6),
    [productsData],
  );

  return (
    <section className="py-16">
      <div className="container mx-auto">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productsLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-96 animate-pulse rounded-lg bg-gray-200"
                />
              ))
            : featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addItem}
                />
              ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
