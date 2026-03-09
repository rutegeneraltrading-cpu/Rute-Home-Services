'use client';

import { useState } from 'react';
import { Button, Label } from '@/components/ui';
import type { Service, ServiceOptionItem } from '@/lib/types/admin/services';
import type { ServiceOptionVariant } from '@/lib/types/admin/services/variant';
import { useCreateBooking } from '@/lib/client/api/bookings/bookings.mutation';
import { usePayFastPayment } from '@/lib/client/api/bookings/payments.mutation';
import { useGetMe } from '@/lib/client/api';
import { AuthRequiredModal, Loading } from '@/components/common';
import type { CreateBookingDTO } from '@/lib/types/bookings';

interface ReviewPaymentStepProps {
  serviceData: Service;
  categoryData: {
    id: string;
    name: string;
    slug?: string;
    description?: string;
  };
  optionsData: ServiceOptionItem[];
  selectedOptions: Record<string, boolean>;
  selectedVariants: Record<string, string>;
  variantsData: ServiceOptionVariant[];
  addressDateData: { address: string; date: string; time: string };
  onBack: () => void;
}

const ReviewPaymentStep = ({
  serviceData,
  categoryData,
  optionsData,
  selectedOptions,
  selectedVariants,
  variantsData,
  addressDateData,
  onBack,
}: ReviewPaymentStepProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoginModalDismissed, setIsLoginModalDismissed] = useState(false);

  const {
    data: user,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useGetMe();
  const createBookingMutation = useCreateBooking();
  const payFastPaymentMutation = usePayFastPayment();

  const shouldOpenLoginModal = !userLoading && !user && !isLoginModalDismissed;

  const selectedOptionsArray = optionsData.filter(
    (opt) => selectedOptions[opt.id],
  );

  // Get selected variants details
  const selectedVariantsArray = Object.values(selectedVariants)
    .map((variantId) => variantsData.find((v) => v.id === variantId))
    .filter(Boolean) as ServiceOptionVariant[];

  // Calculate totals
  const totalPrice =
    (serviceData?.base_price || 0) +
    selectedOptionsArray.reduce((sum, opt) => sum + opt.price, 0) +
    selectedVariantsArray.reduce((sum, variant) => sum + variant.price, 0);

  const totalDuration =
    (serviceData?.duration_minutes || 0) +
    selectedOptionsArray.reduce(
      (sum, opt) => sum + (opt.duration_minutes || 0),
      0,
    ) +
    selectedVariantsArray.reduce(
      (sum, variant) => sum + variant.duration_minutes,
      0,
    );

  const handlePayment = async () => {
    // Check if user is authenticated
    if (!user) {
      setIsLoginModalDismissed(false);
      return;
    }

    setIsProcessing(true);

    try {
      // Split user's full name into first and last name
      const nameParts = user.name?.split(' ') || ['', ''];
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || 'Customer';

      // Step 1: Create booking
      const bookingData: CreateBookingDTO = {
        user_id: user.id,
        service_id: serviceData.id,
        address: addressDateData.address,
        booking_date: addressDateData.date,
        booking_time: addressDateData.time,
        total_price: totalPrice,
        total_duration: totalDuration,
        selected_options: Object.keys(selectedOptions).filter(
          (key) => selectedOptions[key],
        ),
        selected_variants: Object.values(selectedVariants),
      };

      const booking = await createBookingMutation.mutateAsync(bookingData);

      // Step 2: Get PayFast payment URL
      const paymentData = {
        booking_id: booking.id,
        user_id: booking.user_id,
        first_name: firstName,
        last_name: lastName,
        email: user.email || '',
        phone: user.phone || undefined,
        total_price: booking.total_price,
        service_name: serviceData.name,
        service_description: serviceData.description || '',
      };

      payFastPaymentMutation.mutate(paymentData);
    } catch (error) {
      setIsProcessing(false);
      console.error('Error during payment:', error);
    }
  };
  if (isProcessing) return <Loading fullScreen />;
  return (
    <div className="max-w-150">
      <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900">
        Review & Payment
      </h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Category:</Label>
          <span className="text-gray-900 font-medium">{categoryData.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Service:</Label>
          <span className="text-gray-900 font-medium">{serviceData.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Base Price:</Label>
          <span className="text-gray-900">R{serviceData.base_price}</span>
        </div>
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Base Duration:</Label>
          <span className="text-gray-900">
            {serviceData.duration_minutes} min
          </span>
        </div>
        <div>
          <Label className="font-semibold text-gray-700">
            Selected Options:
          </Label>
          {selectedOptionsArray.length === 0 ? (
            <span className="ml-2 text-slate-500">None</span>
          ) : (
            <ul className="ml-4 mt-2 list-disc text-gray-800">
              {selectedOptionsArray.map((opt) => (
                <li key={opt.id} className="mb-1">
                  <span className="font-medium">{opt.name}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    (+R{opt.price}, +{opt.duration_minutes || 0} min)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedVariantsArray.length > 0 && (
          <div>
            <Label className="font-semibold text-gray-700">
              Selected Variants:
            </Label>
            <ul className="ml-4 mt-2 list-disc text-gray-800">
              {selectedVariantsArray.map((variant) => (
                <li key={variant.id} className="mb-1">
                  <span className="font-medium">{variant.name}</span>
                  <span className="text-xs text-slate-500 ml-1">
                    ({variant.type})
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    (+R{variant.price}, +{variant.duration_minutes} min)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Address:</Label>
          <span className="text-gray-900">{addressDateData.address}</span>
        </div>
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Date:</Label>
          <span className="text-gray-900">{addressDateData.date}</span>
        </div>
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Time:</Label>
          <span className="text-gray-900">{addressDateData.time}</span>
        </div>
        <div className="flex flex-col items-center mt-6">
          <div className="bg-slate-100 rounded-xl px-6 py-3 mb-2 w-full text-center">
            <span className="font-bold text-xl text-green-700">
              Total Price: R{totalPrice}
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl px-6 py-2 w-full text-center">
            <span className="font-semibold text-lg">
              Total Duration: {totalDuration} min
            </span>
          </div>
        </div>
      </div>
      {!user && !userLoading && (
        <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            Please log in to continue with payment.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-10">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full sm:w-auto px-5"
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handlePayment}
          disabled={isProcessing || !user || userLoading}
          className="w-full sm:w-auto px-5 bg-linear-to-r from-black to-gray-800 text-white font-bold shadow hover:from-gray-800 hover:to-black"
        >
          {isProcessing
            ? 'Processing...'
            : !user
              ? 'Login to Pay'
              : `Pay R${totalPrice.toFixed(2)}`}
        </Button>
      </div>

      <AuthRequiredModal
        open={shouldOpenLoginModal}
        isAuthenticated={!!user}
        onOpenChange={(open) => {
          if (!open) setIsLoginModalDismissed(true);
        }}
        onAuthenticated={() => {
          refetchUser();
          setIsLoginModalDismissed(true);
        }}
        title="Login Required"
        description="You need to be logged in to complete the booking and payment."
      />
    </div>
  );
};

export default ReviewPaymentStep;
