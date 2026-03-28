'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import type { Service, ServiceOptionItem } from '@/lib/types/admin/services';
import type { ServiceRequirement } from '@/lib/types/admin/services/variant';
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
  selectedRequirements: Record<string, string>;
  requirementsData: ServiceRequirement[];
  additionalDetails: { notes: string };
  addressDateData: {
    address: string;
    unit_or_flat: string;
    date: string;
    time: string;
  };
  isPriorityBooking: boolean;
  priorityFee: number;
  onBack: () => void;
}

const ReviewPaymentStep = ({
  serviceData,
  categoryData,
  optionsData,
  selectedOptions,
  selectedRequirements,
  requirementsData,
  additionalDetails,
  addressDateData,
  isPriorityBooking,
  priorityFee,
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

  const formatRequirementType = (type: string) => {
    const normalized = (type || '').trim().toLowerCase();
    const labelMap: Record<string, string> = {
      size: 'Size',
      property_size: 'Property Size',
      truck_size: 'Truck Size',
      type: 'Service Type',
    };

    return (
      labelMap[normalized] ||
      type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    );
  };

  // Get selected requirements details
  const selectedRequirementsArray = Object.values(selectedRequirements)
    .map((requirementId) =>
      requirementsData.find((requirement) => requirement.id === requirementId),
    )
    .filter(Boolean) as ServiceRequirement[];

  // Calculate totals

  const baseTotal =
    (serviceData?.base_price || 0) +
    selectedOptionsArray.reduce((sum, opt) => sum + opt.price, 0) +
    selectedRequirementsArray.reduce(
      (sum, requirement) => sum + requirement.price,
      0,
    );
  const totalPrice = isPriorityBooking
    ? baseTotal + (priorityFee || 0)
    : baseTotal;
  // Show priority fee in summary if instant booking

  const totalDuration =
    (serviceData?.duration_minutes || 0) +
    selectedOptionsArray.reduce(
      (sum, opt) => sum + (opt.duration_minutes || 0),
      0,
    ) +
    selectedRequirementsArray.reduce(
      (sum, requirement) => sum + requirement.duration_minutes,
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
        unit_or_flat: addressDateData.unit_or_flat?.trim() || undefined,
        booking_date: addressDateData.date,
        booking_time: addressDateData.time,
        total_price: totalPrice,
        total_duration: totalDuration,
        selected_options: Object.keys(selectedOptions).filter(
          (key) => selectedOptions[key],
        ),
        selected_variants: Object.values(selectedRequirements),
        notes: additionalDetails.notes?.trim() || undefined,
        priority_status: isPriorityBooking || undefined,
        priority_fee: isPriorityBooking ? priorityFee : undefined,
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-900">
          Review your booking
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Please confirm your details before continuing to payment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Booking Summary ── */}
        <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-600">
            Booking Summary
          </h4>

          <div className="divide-y divide-slate-100">
            <div className="flex justify-between items-center gap-3 py-2">
              <span className="text-sm text-slate-600 shrink-0">
                Service Category
              </span>
              <span className="text-sm font-semibold text-slate-900 text-right">
                {categoryData.name}
              </span>
            </div>
            <div className="flex justify-between items-center gap-3 py-2">
              <span className="text-sm text-slate-600 shrink-0">
                Selected Service
              </span>
              <span className="text-sm font-semibold text-slate-900 text-right">
                {serviceData.name}
              </span>
            </div>
            <div className="flex justify-between items-center gap-3 py-2">
              <span className="text-sm text-slate-600 shrink-0">
                Service Price
              </span>
              <span className="text-sm font-semibold text-slate-900">
                R{serviceData.base_price}
              </span>
            </div>
            {isPriorityBooking && priorityFee > 0 && (
              <div className="flex justify-between items-center gap-3 py-2">
                <span className="text-sm text-amber-700 font-semibold shrink-0">
                  Instant Booking Fee
                </span>
                <span className="text-sm font-semibold text-amber-700">
                  +R{priorityFee}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center gap-3 py-2">
              <span className="text-sm text-slate-600 shrink-0">
                Service Duration
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {serviceData.duration_minutes} min
              </span>
            </div>
            {addressDateData.unit_or_flat && (
              <div className="flex justify-between items-center gap-3 py-2">
                <span className="text-sm text-slate-600 shrink-0">
                  Unit / Flat #
                </span>
                <span className="text-sm font-semibold text-slate-900 text-right">
                  {addressDateData.unit_or_flat}
                </span>
              </div>
            )}
            <div className="flex justify-between items-start gap-3 py-2">
              <span className="text-sm text-slate-600 shrink-0">Address</span>
              <span className="text-sm font-semibold text-slate-900 text-right">
                {addressDateData.address}
              </span>
            </div>
            <div className="flex justify-between items-center gap-3 py-2">
              <span className="text-sm text-slate-600 shrink-0">
                Booking Date
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {addressDateData.date}
              </span>
            </div>
            <div className="flex justify-between items-center gap-3 py-2">
              <span className="text-sm text-slate-600 shrink-0">
                Booking Time
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {addressDateData.time}
              </span>
            </div>
          </div>
        </section>

        {/* ── Selected Services ── */}
        <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Selected Services
          </h4>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Details</p>
            {selectedRequirementsArray.length === 0 ? (
              <p className="text-sm italic text-slate-400">
                No service details selected.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {selectedRequirementsArray.map((requirement) => (
                  <li
                    key={requirement.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center items-start rounded-md bg-white border border-slate-200 px-3 py-2 gap-1"
                  >
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-slate-900">
                        {requirement.name}
                      </span>
                      <span className="ml-1.5 text-xs text-slate-400">
                        ({formatRequirementType(requirement.type)})
                      </span>
                    </div>
                    <span className="text-xs font-medium text-emerald-600">
                      +R{requirement.price} · {requirement.duration_minutes} min
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Additional Services</p>
            {selectedOptionsArray.length === 0 ? (
              <p className="text-sm italic text-slate-600">
                No additional services selected.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {selectedOptionsArray.map((opt) => (
                  <li
                    key={opt.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center items-start rounded-md bg-white border border-slate-200 px-3 py-2 gap-1"
                  >
                    <span className="text-sm font-semibold text-slate-900">
                      {opt.name}
                    </span>
                    <span className="text-xs font-medium text-emerald-600">
                      +R{opt.price} · {opt.duration_minutes || 0} min
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {additionalDetails.notes?.trim() && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span className="text-sm text-slate-600">Additional Notes</span>
              <p className="mt-1.5 rounded-md bg-white border border-slate-200 p-3 text-sm font-medium text-slate-900 whitespace-pre-wrap">
                {additionalDetails.notes}
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 sm:px-5 py-3 text-center border border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Total Price
          </p>
          <p className="font-bold text-xl text-green-700">R{totalPrice}</p>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 sm:px-5 py-3 text-center border border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Total Duration
          </p>
          <p className="font-bold text-xl text-slate-800">
            {totalDuration} min
          </p>
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
