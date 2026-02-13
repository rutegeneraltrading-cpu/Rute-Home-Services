'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui';
import { useGetMe } from '@/lib/client/api/auth';
import { useGetUserAddresses } from '@/lib/client/api/user-addresses';
import type {
  Service,
  ServiceCategory,
  ServiceOptionItem,
} from '@/lib/types/admin/services';

const steps = [
  { id: 1, name: 'Select Service' },
  { id: 2, name: 'Add Options' },
  { id: 3, name: 'Address & Date' },
  { id: 4, name: 'Review & Pay' },
];

const BookingPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categorySlug = searchParams.get('category');

  const { data: currentUser } = useGetMe();
  const { data: addressesResponse } = useGetUserAddresses();
  const addressesData = addressesResponse?.addresses || [];

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, boolean>
  >({});
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // New address form
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    line1: '',
    city: '',
    state_province: '',
    postal_code: '',
  });

  const { data: categoriesData = [] } = useQuery({
    queryKey: ['public-service-categories'],
    queryFn: async (): Promise<ServiceCategory[]> => {
      const response = await fetch('/api/services/categories');
      if (!response.ok) throw new Error('Failed to fetch service categories');
      const data = await response.json();
      return data?.categories || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const category = useMemo(
    () => categoriesData.find((c) => c.slug === categorySlug) || null,
    [categoriesData, categorySlug],
  );

  const { data: servicesData = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['public-services'],
    queryFn: async (): Promise<Service[]> => {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      return data?.services || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredServices = useMemo(() => {
    if (!category) return [];
    return servicesData.filter(
      (service) => service.category_id === category.id,
    );
  }, [servicesData, category]);

  const selectedService = useMemo(
    () =>
      selectedServiceId
        ? filteredServices.find((s) => s.id === selectedServiceId) || null
        : null,
    [selectedServiceId, filteredServices],
  );

  const { data: optionsData = [], isLoading: optionsLoading } = useQuery({
    queryKey: ['public-service-options', selectedServiceId],
    queryFn: async (): Promise<ServiceOptionItem[]> => {
      const response = await fetch(
        `/api/services/${selectedServiceId}/options`,
      );
      if (!response.ok) throw new Error('Failed to fetch service options');
      const data = await response.json();
      return data?.options || [];
    },
    enabled: !!selectedServiceId,
    staleTime: 5 * 60 * 1000,
  });

  const selectedOptionsArray = useMemo(
    () => optionsData.filter((opt) => selectedOptions[opt.id]),
    [optionsData, selectedOptions],
  );

  const totalPrice = useMemo(() => {
    let total = selectedService?.base_price || 0;
    selectedOptionsArray.forEach((opt) => {
      total += opt.price;
    });
    return total;
  }, [selectedService, selectedOptionsArray]);

  const totalDuration = useMemo(() => {
    let duration = selectedService?.duration_minutes || 0;
    selectedOptionsArray.forEach((opt) => {
      duration += opt.duration_minutes || 0;
    });
    return duration;
  }, [selectedService, selectedOptionsArray]);

  // Clear options when service changes
  useEffect(() => {
    if (selectedServiceId) {
      setSelectedOptions({});
    }
  }, [selectedServiceId]);

  // Auto-select primary address on mount
  useEffect(() => {
    if (addressesData.length > 0 && !selectedAddressId) {
      const primaryAddress = addressesData.find((addr) => addr.is_primary);
      if (primaryAddress) {
        setSelectedAddressId(primaryAddress.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!categorySlug) {
    router.push('/services');
    return null;
  }

  if (!category) {
    return (
      <div className="py-12">
        <div className="container mx-auto text-center">
          <p className="text-slate-600">Category not found. Redirecting...</p>
        </div>
      </div>
    );
  }

  const selectedAddress = addressesData.find(
    (addr) => addr.id === selectedAddressId,
  );

  // Time slots (9 AM - 5 PM, hourly)
  const timeSlots = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ];

  return (
    <div className="py-12 bg-slate-50">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep === step.id
                        ? 'bg-black text-white'
                        : currentStep > step.id
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {step.id}
                  </div>
                  <p
                    className={`mt-2 text-sm font-medium ${
                      currentStep === step.id ? 'text-black' : 'text-slate-600'
                    }`}
                  >
                    {step.name}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      currentStep > step.id ? 'bg-green-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && `Select a ${category.name} Service`}
              {currentStep === 2 &&
                `Add Options to ${selectedService?.name || 'Service'}`}
              {currentStep === 3 && 'Address & Schedule'}
              {currentStep === 4 && 'Review & Payment'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Choose the service you need'}
              {currentStep === 2 &&
                'Select any add-ons or proceed with base service'}
              {currentStep === 3 && 'Choose address and pick a time slot'}
              {currentStep === 4 && 'Review your booking and complete payment'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Select Service */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {servicesLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-32 rounded-lg bg-slate-200 animate-pulse"
                      />
                    ))
                  : filteredServices.map((service) => (
                      <Card
                        key={service.id}
                        className={`cursor-pointer transition-all border-2 ${
                          selectedServiceId === service.id
                            ? 'border-black shadow-md'
                            : 'hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedServiceId(service.id)}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {service.name}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {service.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                          <Badge variant="secondary">{category.name}</Badge>
                          <span className="text-sm font-semibold text-green-700">
                            From R{service.base_price}
                          </span>
                        </CardContent>
                      </Card>
                    ))}
              </div>
            )}

            {/* Step 2: Select Options */}
            {currentStep === 2 && selectedService && (
              <div>
                {optionsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-20 rounded-lg bg-slate-200 animate-pulse"
                      />
                    ))}
                  </div>
                ) : optionsData.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center text-slate-600">
                    No add-ons available. You can proceed with the base service.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {optionsData.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                          selectedOptions[option.id]
                            ? 'border-black bg-white'
                            : 'hover:shadow-sm'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={!!selectedOptions[option.id]}
                          onChange={(e) => {
                            setSelectedOptions((prev) => ({
                              ...prev,
                              [option.id]: e.target.checked,
                            }));
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">
                            {option.name}
                          </div>
                          {option.description && (
                            <p className="text-sm text-slate-600">
                              {option.description}
                            </p>
                          )}
                          <p className="text-sm text-green-700 font-semibold">
                            +R{option.price}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Address & Date */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Address Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Address</h3>
                  {!currentUser ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-slate-600">
                      Please log in to select an address or add a new one.
                    </div>
                  ) : addressesData.length === 0 && !showNewAddressForm ? (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <p className="text-slate-600 mb-3">
                        No saved addresses found.
                      </p>
                      <Button onClick={() => setShowNewAddressForm(true)}>
                        Add New Address
                      </Button>
                    </div>
                  ) : (
                    <>
                      <RadioGroup
                        value={selectedAddressId}
                        onValueChange={setSelectedAddressId}
                      >
                        {addressesData.map((address) => (
                          <div
                            key={address.id}
                            className="flex items-start space-x-3 rounded-lg border p-4"
                          >
                            <RadioGroupItem
                              value={address.id}
                              id={address.id}
                            />
                            <Label
                              htmlFor={address.id}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-semibold">
                                {address.label}
                                {address.is_primary && (
                                  <Badge className="ml-2" variant="secondary">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">
                                {address.line1}, {address.city},{' '}
                                {address.state_province} {address.postal_code}
                              </p>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {!showNewAddressForm && (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setShowNewAddressForm(true)}
                        >
                          + Add New Address
                        </Button>
                      )}
                    </>
                  )}

                  {showNewAddressForm && (
                    <div className="mt-4 p-4 border rounded-lg space-y-4">
                      <h4 className="font-semibold">New Address</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <Label htmlFor="line1">Street Address</Label>
                          <Input
                            id="line1"
                            value={newAddress.line1}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                line1: e.target.value,
                              })
                            }
                            placeholder="123 Main Street"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={newAddress.city}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                city: e.target.value,
                              })
                            }
                            placeholder="Cape Town"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state_province">Province</Label>
                          <Input
                            id="state_province"
                            value={newAddress.state_province}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                state_province: e.target.value,
                              })
                            }
                            placeholder="Western Cape"
                          />
                        </div>
                        <div>
                          <Label htmlFor="postal_code">Postal Code</Label>
                          <Input
                            id="postal_code"
                            value={newAddress.postal_code}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                postal_code: e.target.value,
                              })
                            }
                            placeholder="8001"
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNewAddressForm(false);
                          setNewAddress({
                            line1: '',
                            city: '',
                            state_province: '',
                            postal_code: '',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                {/* Date & Time Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Select Date & Time
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Service Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Service Time</Label>
                      <select
                        id="time"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      >
                        <option value="">Select time</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {selectedDate && selectedTime && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✓ Slot available on{' '}
                        {new Date(selectedDate).toLocaleDateString()} at{' '}
                        {selectedTime}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Estimated duration: {totalDuration} minutes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Review & Payment */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Booking Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Booking Summary
                  </h3>
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Service:</span>
                      <span className="font-semibold">
                        {selectedService?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Category:</span>
                      <span>{category.name}</span>
                    </div>
                    {selectedOptionsArray.length > 0 && (
                      <div>
                        <span className="text-slate-600">Add-ons:</span>
                        <ul className="mt-1 ml-4 text-sm">
                          {selectedOptionsArray.map((opt) => (
                            <li key={opt.id}>
                              • {opt.name} (+R{opt.price})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Address:</span>
                      <span className="text-right text-sm">
                        {selectedAddress ? (
                          <>
                            {selectedAddress.line1}, {selectedAddress.city}
                          </>
                        ) : (
                          'Not selected'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date & Time:</span>
                      <span>
                        {selectedDate && selectedTime
                          ? `${new Date(selectedDate).toLocaleDateString()} at ${selectedTime}`
                          : 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Duration:</span>
                      <span>{totalDuration} minutes</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-green-700">
                        R{totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Payment</h3>
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-slate-600 mb-4">
                      Click below to proceed with secure payment via Ozow
                    </p>
                    <Button size="lg" className="w-full sm:w-auto">
                      Proceed to Payment - R{totalPrice.toFixed(2)}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === 1) {
                router.push('/services');
              } else {
                setCurrentStep((prev) => prev - 1);
              }
            }}
          >
            {currentStep === 1 ? 'Back to Categories' : 'Previous'}
          </Button>
          <Button
            onClick={() => {
              if (currentStep === 1 && selectedServiceId) {
                setCurrentStep(2);
              } else if (currentStep === 2) {
                setCurrentStep(3);
              } else if (
                currentStep === 3 &&
                selectedAddressId &&
                selectedDate &&
                selectedTime
              ) {
                setCurrentStep(4);
              } else if (currentStep === 4) {
                // Handle payment/booking creation
                alert('Payment integration coming soon!');
              }
            }}
            disabled={
              (currentStep === 1 && !selectedServiceId) ||
              (currentStep === 3 &&
                (!selectedAddressId || !selectedDate || !selectedTime))
            }
          >
            {currentStep === 4 ? 'Complete Booking' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
