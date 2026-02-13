'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/contexts';
import { Button, Card, CardContent, Input } from '@/components/ui';

const CartPage = () => {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const item = items.find((i) => i.id === productId);
    if (item && newQuantity <= item.stock) {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleProceedToCheckout = () => {
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <ShoppingBag className="h-24 w-24 text-slate-300 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Your Cart is Empty
          </h2>
          <p className="text-slate-600 mb-8">
            Looks like you haven&apos;t added any products to your cart yet.
          </p>
          <Button onClick={() => router.push('/shop')} size="lg">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto xl:px-0 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Shopping Cart
            </h1>
            <p className="text-slate-600">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const itemPrice = item.sale_price || item.price;
                const itemTotal = itemPrice * item.quantity;
                const itemImage = item.images?.[0]?.url || '/image.png';

                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <Link
                          href={`/shop/${item.slug || item.id}`}
                          className="shrink-0"
                        >
                          <div className="relative w-24 h-24 bg-gray-100 rounded-md overflow-hidden">
                            <Image
                              src={itemImage}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/shop/${item.slug || item.id}`}
                                className="font-semibold text-slate-900 hover:text-green-600 line-clamp-1 block"
                              >
                                {item.name}
                              </Link>
                              {item.brand && (
                                <p className="text-sm text-slate-500">
                                  {item.brand}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between gap-4 mt-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    item.quantity - 1,
                                  )
                                }
                                disabled={item.quantity <= 1}
                                className="h-8 w-8"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  handleQuantityChange(item.id, val);
                                }}
                                className="w-16 h-8 text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                min={1}
                                max={item.stock}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    item.quantity + 1,
                                  )
                                }
                                disabled={item.quantity >= item.stock}
                                className="h-8 w-8"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              {item.sale_price && (
                                <p className="text-xs text-slate-400 line-through">
                                  R{item.price.toFixed(2)}
                                </p>
                              )}
                              <p className="font-bold text-green-600">
                                R{itemTotal.toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-500">
                                R{itemPrice.toFixed(2)} each
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Clear Cart Button */}
              <Button
                variant="outline"
                onClick={clearCart}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-18">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    Order Summary
                  </h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal ({totalItems} items)</span>
                      <span className="font-medium">
                        R{totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping</span>
                      <span className="font-medium">
                        Calculated at checkout
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-slate-900">
                          Total
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          R{totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleProceedToCheckout}
                    className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                  >
                    Proceed to Checkout
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.push('/shop')}
                    className="w-full mt-3"
                  >
                    Continue Shopping
                  </Button>

                  {/* Security Notice */}
                  <div className="mt-6 p-4 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-600 text-center">
                      🔒 Secure checkout powered by Ozow
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPage;
