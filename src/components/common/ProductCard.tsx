'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/client/api/products';
import {
  Card,
  Badge,
  Button,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from '@/components/ui';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const images =
    product.images && product.images.length > 0
      ? product.images.map((img) => img.url)
      : ['/image.png'];

  // Image carousel on hover (2s interval) and reset on hover end
  useEffect(() => {
    if (images.length <= 1) return;

    if (!isHovered) {
      // Reset will happen via the interval cleanup
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 2000);

    return () => {
      clearInterval(interval);
      // Reset to first image when hover ends
      setCurrentImageIndex(0);
    };
  }, [isHovered, images.length]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
      toast(
        <>
          <div className="font-semibold">Added to Cart</div>
          <div>{`${product.name} has been added to your cart.`}</div>
        </>,
      );
    }
  };

  return (
    <Link href={`/shop/${product.slug || product.id}`} className="block h-full">
      <Card
        className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group pt-0 justify-between"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section with Add to Cart Overlay */}
        <div className="relative h-58 bg-slate-100 overflow-hidden">
          <Image
            src={images[currentImageIndex]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />

          {/* Sale Badge */}
          {product.sale_price && (
            <Badge
              variant="destructive"
              className="absolute top-2 left-2 z-10 bg-red-500"
            >
              Sale
            </Badge>
          )}

          {/* Image indicator dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentImageIndex
                      ? 'w-6 bg-white'
                      : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Add to Cart Overlay (visible on hover) */}
          <div className="absolute inset-0 bg-black/40 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Product Details */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-1">
              {product.name}
            </CardTitle>
            {product.brand && (
              <Badge variant="outline" className="text-xs shrink-0">
                {product.brand}
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-2">
            {product.description || 'No description available'}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex items-center justify-between">
          <Badge variant="secondary">{product.category?.name || 'Other'}</Badge>

          {/* Price */}
          <div className="flex items-center gap-2">
            {product.sale_price ? (
              <>
                <span className="text-xs text-slate-400 line-through">
                  R{product.price.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-green-700">
                  R{product.sale_price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-green-700">
                R{product.price.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
