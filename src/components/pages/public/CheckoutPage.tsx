'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useGetMe, useGetUserAddresses } from '@/lib/client/api';
import { useCart } from '@/lib/contexts';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components/ui';
import { Loading, AuthRequiredModal } from '@/components/common';

interface ShippingAddress {
  recipient_name?: string | null;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
}

const CheckoutPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: addressesData = { addresses: [] }, refetch: refetchAddresses } =
    useGetUserAddresses();
  const { items, totalPrice, clearCart } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [newAddress, setNewAddress] = useState<ShippingAddress>({
    recipient_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'South Africa',
  });

  const [additionalNotes, setAdditionalNotes] = useState('');

  // Check payment status from URL params
  useEffect(() => {
    const status = searchParams?.get('status');
    const order = searchParams?.get('order');

    if (status === 'success' && order) {
      setPaymentStatus('success');
      setOrderId(order);
      clearCart();
    } else if (status === 'cancelled') {
      setPaymentStatus('cancelled');
    } else if (status === 'error') {
      setPaymentStatus('error');
    }
  }, [searchParams, clearCart]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      setShowLoginModal(true);
    }
  }, [user, userLoading]);

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (!paymentStatus && items.length === 0) {
      router.push('/cart');
    }
  }, [items, router, paymentStatus]);

  const addresses = addressesData.addresses || [];
  const primaryAddressId = addresses.find((addr) => addr.is_primary)?.id;
  const effectiveAddressId = selectedAddressId ?? primaryAddressId ?? 'other';

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (effectiveAddressId === 'other') {
      if (
        !newAddress.line1 ||
        !newAddress.city ||
        !newAddress.state_province ||
        !newAddress.postal_code
      ) {
        alert('Please fill in all address fields');
        return false;
      }
    } else if (!effectiveAddressId) {
      alert('Please select a shipping address');
      return false;
    }
    return true;
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      const selectedAddress =
        effectiveAddressId === 'other'
          ? newAddress
          : addresses.find((addr) => addr.id === effectiveAddressId);

      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.sale_price || item.price,
          })),
          total_amount: totalPrice,
          shipping_address: selectedAddress,
          payment_method: 'ozow',
          additional_notes: additionalNotes,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const { order } = await orderResponse.json();

      // Initialize Ozow payment
      const ozowResponse = await fetch('/api/ozow/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          amount: totalPrice,
        }),
      });

      if (!ozowResponse.ok) {
        throw new Error('Failed to initialize payment');
      }

      const { payment_url } = await ozowResponse.json();

      // Redirect to Ozow payment page
      window.location.href = payment_url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  // Payment Success Screen
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="mb-6">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Payment Successful!
            </h2>
            <p className="text-slate-600 mb-6">
              Your order #{orderId?.substring(0, 8)} has been confirmed. We will
              send you an email with order details shortly.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/user/orders')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View My Orders
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/shop')}
                className="w-full"
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment Cancelled/Error Screen
  if (paymentStatus === 'cancelled' || paymentStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="mb-6">
              <XCircle className="h-20 w-20 text-red-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              {paymentStatus === 'cancelled'
                ? 'Payment Cancelled'
                : 'Payment Failed'}
            </h2>
            <p className="text-slate-600 mb-6">
              {paymentStatus === 'cancelled'
                ? 'Your payment was cancelled. You can try again or continue shopping.'
                : 'There was an error processing your payment. Please try again.'}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setPaymentStatus(null);
                  router.push('/checkout');
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/cart')}
                className="w-full"
              >
                Back to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userLoading) return <Loading fullScreen />;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto xl:px-0 px-4">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/cart')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Checkout</h1>
            <p className="text-slate-600">Complete your order</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-slate-700">
                        Select an address
                      </p>
                      <div className="space-y-2">
                        {addresses.map((address) => (
                          <label
                            key={address.id}
                            className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                              effectiveAddressId === address.id
                                ? 'border-green-600 bg-green-50'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="shippingAddress"
                              className="mt-1"
                              checked={effectiveAddressId === address.id}
                              onChange={() => setSelectedAddressId(address.id)}
                            />
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">
                                  {address.recipient_name || 'Recipient'}
                                </span>
                                {address.is_primary && (
                                  <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-600">
                                {address.line1}
                                {address.line2 ? `, ${address.line2}` : ''}
                              </p>
                              <p className="text-slate-600">
                                {address.city}, {address.state_province}{' '}
                                {address.postal_code}
                              </p>
                              <p className="text-slate-600">
                                {address.country}
                              </p>
                              {address.phone && (
                                <p className="text-slate-500">
                                  {address.phone}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}

                        <label
                          className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                            effectiveAddressId === 'other'
                              ? 'border-green-600 bg-green-50'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="shippingAddress"
                            className="mt-1"
                            checked={effectiveAddressId === 'other'}
                            onChange={() => setSelectedAddressId('other')}
                          />
                          <div className="text-sm">
                            <span className="font-medium text-slate-900">
                              Use another address
                            </span>
                            <p className="text-slate-600">
                              Enter a new shipping address
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {addresses.length === 0 && (
                    <p className="text-sm text-slate-600">
                      No saved addresses found. Please add a new address below.
                    </p>
                  )}

                  {(effectiveAddressId === 'other' ||
                    addresses.length === 0) && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="line1">Street Address *</Label>
                        <Input
                          id="line1"
                          value={newAddress.line1}
                          onChange={(e) =>
                            handleAddressChange('line1', e.target.value)
                          }
                          placeholder="123 Main Street"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="line2">
                          Apartment, suite, etc. (optional)
                        </Label>
                        <Input
                          id="line2"
                          value={newAddress.line2 || ''}
                          onChange={(e) =>
                            handleAddressChange('line2', e.target.value)
                          }
                          placeholder="Unit 12, Building A"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={newAddress.city}
                            onChange={(e) =>
                              handleAddressChange('city', e.target.value)
                            }
                            placeholder="Johannesburg"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="state_province">Province *</Label>
                          <Input
                            id="state_province"
                            value={newAddress.state_province}
                            onChange={(e) =>
                              handleAddressChange(
                                'state_province',
                                e.target.value,
                              )
                            }
                            placeholder="Gauteng"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="postal_code">Postal Code *</Label>
                          <Input
                            id="postal_code"
                            value={newAddress.postal_code}
                            onChange={(e) =>
                              handleAddressChange('postal_code', e.target.value)
                            }
                            placeholder="2000"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={newAddress.country}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="recipient_name">Recipient Name</Label>
                          <Input
                            id="recipient_name"
                            value={newAddress.recipient_name || ''}
                            onChange={(e) =>
                              handleAddressChange(
                                'recipient_name',
                                e.target.value,
                              )
                            }
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={newAddress.phone || ''}
                            onChange={(e) =>
                              handleAddressChange('phone', e.target.value)
                            }
                            placeholder="+27 81 234 5678"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <textarea
                      id="notes"
                      value={additionalNotes}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setAdditionalNotes(e.target.value)
                      }
                      placeholder="Special delivery instructions, etc."
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <Package className="h-4 w-4 text-slate-600" />
                    <div>
                      You will be redirected to <strong>Ozow</strong> to
                      complete your payment securely. Ozow supports EFT, credit
                      cards, and instant payment methods.
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-center p-4 bg-slate-50 rounded-md">
                    <Image
                      src="https://ozow.com/images/ozow-logo.svg"
                      alt="Ozow"
                      width={120}
                      height={32}
                      className="h-8 w-auto"
                    />
                    <span className="hidden text-lg font-semibold text-slate-700">
                      Ozow Payment Gateway
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-18">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {items.map((item) => {
                      const itemPrice = item.sale_price || item.price;
                      const itemTotal = itemPrice * item.quantity;
                      return (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-slate-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium ml-2">
                            R{itemTotal.toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>R{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping</span>
                      <span>TBD</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-900">
                          Total
                        </span>
                        <span className="font-bold text-green-600 text-lg">
                          R{totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmitOrder}
                    disabled={isProcessing}
                    className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    🔒 Secure payment powered by Ozow
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <AuthRequiredModal
        open={showLoginModal}
        isAuthenticated={!!user}
        onOpenChange={setShowLoginModal}
        onAuthenticated={() => {
          refetchAddresses();
        }}
        title="Login Required"
        description="You need to be logged in to checkout."
      />
    </>
  );
};

export default CheckoutPage;
