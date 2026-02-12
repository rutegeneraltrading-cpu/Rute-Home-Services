'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import { useCart } from '@/lib/contexts';
import { useGetProducts } from '@/lib/client/api';
import { ProductCard } from '@/components/common';
import type { Product } from '@/lib/client/api/products';
import { Button, Badge, Card, CardContent } from '@/components/ui';

const SingleProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { data: productsData = [], isLoading } = useGetProducts();
  const { addItem } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Find current product by slug or id
  const product = useMemo(() => {
    return (productsData as Product[]).find(
      (p) => p.slug === slug || p.id === slug,
    );
  }, [productsData, slug]);

  // Get related products (same category, excluding current product)
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return (productsData as Product[])
      .filter(
        (p) => p.category_id === product.category_id && p.id !== product.id,
      )
      .slice(0, 4);
  }, [productsData, product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="aspect-square bg-gray-200 rounded-lg" />
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded w-3/4" />
                <div className="h-6 bg-gray-200 rounded w-1/4" />
                <div className="h-20 bg-gray-200 rounded" />
                <div className="h-12 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Product Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            The product you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push('/shop')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map((img) => img.url)
      : ['/image.png'];

  const currentPrice = product.sale_price || product.price;
  const hasDiscount = !!product.sale_price;

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast(
      <>
        <div className="font-semibold">Added to Cart</div>
        <div>{`${product.name} has been added to your cart.`}</div>
      </>,
    );
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/shop')}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden">
              <Image
                src={images[selectedImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {hasDiscount && (
                <Badge variant="destructive" className="absolute top-4 left-4">
                  Sale
                </Badge>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-green-600 ring-2 ring-green-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title & Brand */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
                  {product.name}
                </h1>
                {product.brand && (
                  <Badge variant="outline" className="shrink-0">
                    {product.brand}
                  </Badge>
                )}
              </div>
              {product.category && (
                <Badge variant="secondary">{product.category.name}</Badge>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-green-600">
                R{currentPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xl text-slate-400 line-through">
                  R{product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Description
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Product Details */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {product.sku && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">SKU:</span>
                      <span className="font-medium text-slate-900">
                        {product.sku}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Stock:</span>
                    <span
                      className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {product.stock > 0
                        ? `${product.stock} available`
                        : 'Out of stock'}
                    </span>
                  </div>
                  {product.attributes &&
                    Object.keys(product.attributes).length > 0 && (
                      <div>
                        <span className="text-slate-600 block mb-2">
                          Attributes:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(product.attributes).map(
                            ([key, value]) => (
                              <Badge key={key} variant="outline">
                                {key}: {String(value)}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-900 mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="h-10 w-10"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-16 text-center font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock}
                      className="h-10 w-10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-slate-600">
                    {product.stock} available
                  </span>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
                Related Products
              </h2>
              <p className="text-slate-600">
                More products from {product.category?.name}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  onAddToCart={addItem}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleProductPage;
