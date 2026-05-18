'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import { useGetMe, useGetUserAddresses } from '@/lib/client/api';
import {
  useCreateOrder,
  useOrderPayFastPayment,
} from '@/lib/client/api/orders/orders.mutation';
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
import type { CreateOrderDTO } from '@/lib/types/orders';
import { checkoutAddressSchema } from '@/lib/validations';

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
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: addressesData = { addresses: [] }, refetch: refetchAddresses } =
    useGetUserAddresses();
  const { items, totalPrice } = useCart();
  const createOrderMutation = useCreateOrder();
  const orderPayFastPaymentMutation = useOrderPayFastPayment();

  const [isProcessing, setIsProcessing] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

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
  const [addressErrors, setAddressErrors] = useState<
    Partial<Record<keyof ShippingAddress, string>>
  >({});

  const [additionalNotes, setAdditionalNotes] = useState('');

  // Derive showLoginModal from user state
  const showLoginModal = !userLoading && !user;

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items.length, router]);

  const addresses = addressesData.addresses || [];
  const primaryAddressId = addresses.find((addr) => addr.is_primary)?.id;
  const effectiveAddressId = selectedAddressId ?? primaryAddressId ?? 'other';

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
    if (addressErrors[field]) {
      setAddressErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): {
    isValid: boolean;
    parsedAddress?: Omit<
      CreateOrderDTO,
      | 'items'
      | 'subtotal'
      | 'tax'
      | 'shipping'
      | 'total'
      | 'notes'
      | 'address_id'
    >['new_address'];
  } => {
    if (effectiveAddressId === 'other') {
      const validation = checkoutAddressSchema.safeParse(newAddress);

      if (!validation.success) {
        const fieldErrors = validation.error.flatten().fieldErrors;
        setAddressErrors({
          recipient_name: fieldErrors.recipient_name?.[0],
          phone: fieldErrors.phone?.[0],
          line1: fieldErrors.line1?.[0],
          line2: fieldErrors.line2?.[0],
          city: fieldErrors.city?.[0],
          state_province: fieldErrors.state_province?.[0],
          postal_code: fieldErrors.postal_code?.[0],
          country: fieldErrors.country?.[0],
        });
        return { isValid: false };
      }

      setAddressErrors({});

      return {
        isValid: true,
        parsedAddress: {
          label: 'other',
          recipient_name: validation.data.recipient_name || null,
          phone: validation.data.phone || null,
          line1: validation.data.line1,
          line2: validation.data.line2 || null,
          city: validation.data.city,
          state_province: validation.data.state_province,
          postal_code: validation.data.postal_code,
          country: validation.data.country,
        },
      };
    } else if (!effectiveAddressId) {
      alert('Please select a shipping address');
      return { isValid: false };
    }

    return { isValid: true };
  };

  const handleSubmitOrder = async () => {
    const validationResult = validateForm();
    if (!validationResult.isValid) return;

    setIsProcessing(true);

    try {
      const subtotal = totalPrice;
      const tax = 0;
      const shipping = 0;
      const total = subtotal + tax + shipping;

      const createOrderPayload: CreateOrderDTO = {
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.sale_price || item.price,
        })),
        subtotal,
        tax,
        shipping,
        total,
        notes: additionalNotes || undefined,
      };

      if (effectiveAddressId === 'other') {
        createOrderPayload.new_address = validationResult.parsedAddress;
      } else {
        createOrderPayload.address_id = effectiveAddressId;
      }

      const order = await createOrderMutation.mutateAsync(createOrderPayload);

      const nameParts = user?.name?.split(' ') || ['', ''];
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      await orderPayFastPaymentMutation.mutateAsync({
        order_id: order.id,
        user_id: order.user_id,
        first_name: firstName,
        last_name: lastName,
        email: user?.email || '',
        phone: user?.phone || undefined,
        total: order.total,
      });
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  if (
    isProcessing ||
    createOrderMutation.isPending ||
    orderPayFastPaymentMutation.isPending
  )
    return <Loading fullScreen />;

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
                        {addressErrors.line1 && (
                          <p className="mt-1 text-sm text-red-600">
                            {addressErrors.line1}
                          </p>
                        )}
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
                          {addressErrors.city && (
                            <p className="mt-1 text-sm text-red-600">
                              {addressErrors.city}
                            </p>
                          )}
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
                          {addressErrors.state_province && (
                            <p className="mt-1 text-sm text-red-600">
                              {addressErrors.state_province}
                            </p>
                          )}
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
                          {addressErrors.postal_code && (
                            <p className="mt-1 text-sm text-red-600">
                              {addressErrors.postal_code}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={newAddress.country}
                            disabled
                          />
                          {addressErrors.country && (
                            <p className="mt-1 text-sm text-red-600">
                              {addressErrors.country}
                            </p>
                          )}
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
                          {addressErrors.recipient_name && (
                            <p className="mt-1 text-sm text-red-600">
                              {addressErrors.recipient_name}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone *</Label>
                          <PhoneInput
                            country={'za'}
                            inputProps={{
                              name: 'phone',
                              className:
                                'h-9 w-full border rounded-md shadow-xs px-2 pl-12',
                            }}
                            value={newAddress.phone || ''}
                            onChange={(value) =>
                              handleAddressChange('phone', value)
                            }
                            placeholder="+27 81 234 5678"
                            enableSearch
                            containerClass="mb-2"
                          />
                          {addressErrors.phone && (
                            <p className="mt-1 text-sm text-red-600">
                              {addressErrors.phone}
                            </p>
                          )}
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
                    disabled={
                      isProcessing ||
                      createOrderMutation.isPending ||
                      orderPayFastPaymentMutation.isPending
                    }
                    className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ||
                    createOrderMutation.isPending ||
                    orderPayFastPaymentMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    🔒 Secure payment powered by PayFast
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
        onOpenChange={(open) => {
          if (!open && !user && !wasAuthenticated) router.push('/cart');
        }}
        onAuthenticated={() => {
          setWasAuthenticated(true);
          refetchAddresses();
        }}
        title="Login Required"
        description="You need to be logged in to checkout."
      />
    </>
  );
};

export default CheckoutPage;
