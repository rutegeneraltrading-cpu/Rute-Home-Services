'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useJsApiLoader } from '@react-google-maps/api';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  CreditCard,
  MapPin,
  PlusCircle,
  User,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loading } from '@/components/common';
import {
  useGetBooking,
  useGetAdditionalWorks,
} from '@/lib/client/api/bookings/bookings.query';
import {
  useCreateAdditionalWork,
  useRetryAdditionalWorkPayment,
} from '@/lib/client/api/bookings/payments.mutation';
import { useGetProfile } from '@/lib/client/api/profile/profile.query';
import type {
  BookingOptionDetail,
  BookingVariantDetail,
} from '@/lib/types/bookings';

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  assigned: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const paymentStatusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

const assignmentStatusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  declined: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

const BookingDetailsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const bookingId = params?.id;

  const { data: booking, isLoading, isError } = useGetBooking(bookingId || '');
  const { data: additionalWorks = [] } = useGetAdditionalWorks(bookingId || '');
  const { data: profile } = useGetProfile();
  const createAdditionalWork = useCreateAdditionalWork(bookingId || '');
  const retryAdditionalWorkPayment = useRetryAdditionalWorkPayment(bookingId || '');

  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [additionalWorkModalOpen, setAdditionalWorkModalOpen] = useState(false);
  const [awDescription, setAwDescription] = useState('');
  const [awFee, setAwFee] = useState('');

  const ratingFromUrl = useMemo(() => {
    const raw = searchParams.get('rating');
    const parsed = raw ? Number(raw) : NaN;
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 0;
  }, [searchParams]);

  const shouldOpenRatingModalFromUrl =
    searchParams.get('rate') === 'true' && booking?.status === 'completed';

  useEffect(() => {
    if (!booking) return;

    if (shouldOpenRatingModalFromUrl) {
      setRating(ratingFromUrl);
      setRatingModalOpen(true);
      return;
    }

    if (searchParams.get('rate') === 'true' && booking.status !== 'completed') {
      toast.error('Rating is available only after booking is completed.');
    }
  }, [booking, shouldOpenRatingModalFromUrl, ratingFromUrl, searchParams]);

  const clearRatingQueryFromUrl = () => {
    if (!bookingId) return;
    router.replace(`/user/bookings/${bookingId}`);
  };

  const handleRatingModalOpenChange = (open: boolean) => {
    setRatingModalOpen(open);
    if (!open) {
      clearRatingQueryFromUrl();
    }
  };

  const handleSubmitRating = async () => {
    if (!bookingId) return;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      toast.error('Please select a rating from 1 to 5 stars.');
      return;
    }

    try {
      setIsSubmittingRating(true);

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          rating,
          review: review.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to save rating');
      }

      toast.success('Thank you! Your rating has been submitted.');
      setRatingModalOpen(false);
      clearRatingQueryFromUrl();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save your rating.',
      );
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSubmitAdditionalWork = async () => {
    if (!awDescription.trim()) {
      toast.error('Please describe the additional work.');
      return;
    }
    const parsedFee = parseFloat(awFee);
    if (!parsedFee || parsedFee <= 0 || !Number.isFinite(parsedFee)) {
      toast.error('Please enter a valid fee amount.');
      return;
    }
    await createAdditionalWork.mutateAsync({
      description: awDescription.trim(),
      fee: parsedFee,
    });
    setAdditionalWorkModalOpen(false);
    setAwDescription('');
    setAwFee('');
  };

  const selectedOptions: BookingOptionDetail[] = Array.isArray(
    booking?.selected_option_details,
  )
    ? booking.selected_option_details
    : Array.isArray(booking?.selected_options)
      ? booking.selected_options.filter(Boolean).map((id) => ({
          id: String(id),
          name: String(id),
        }))
      : [];

  const selectedVariants: BookingVariantDetail[] = Array.isArray(
    booking?.selected_variant_details,
  )
    ? booking.selected_variant_details
    : Array.isArray(booking?.selected_variants)
      ? booking.selected_variants
          .filter(Boolean)
          .map((id) => ({ id: String(id), name: String(id) }))
      : [];

  const movingAddresses =
    booking?.address &&
    booking.address.includes('to=') &&
    booking.address.includes('from=')
      ? (() => {
          const params = new URLSearchParams(booking.address);
          const to = decodeURIComponent(params.get('to') || '');
          const from = decodeURIComponent(params.get('from') || '');

          return from && to ? { from, to } : null;
        })()
      : null;

  const isMovingBooking = Boolean(movingAddresses);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [distanceError, setDistanceError] = useState('');
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });
  const isDistanceLoading =
    isMovingBooking &&
    isGoogleMapsLoaded &&
    distanceKm === null &&
    !distanceError;

  useEffect(() => {
    if (
      !isMovingBooking ||
      !movingAddresses ||
      !isGoogleMapsLoaded ||
      typeof window === 'undefined' ||
      !window.google?.maps
    ) {
      return;
    }

    let cancelled = false;

    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [movingAddresses.from],
        destinations: [movingAddresses.to],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (cancelled) return;

        if (
          status === 'OK' &&
          response?.rows?.[0]?.elements?.[0]?.status === 'OK'
        ) {
          const meters = response.rows[0].elements[0].distance.value;
          setDistanceKm(Math.ceil(meters / 1000));
          setDistanceError('');
        } else {
          setDistanceKm(null);
          setDistanceError('Unable to calculate moving distance.');
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [isMovingBooking, isGoogleMapsLoaded, movingAddresses]);

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (isError || !booking) {
    return (
      <div className="py-10 space-y-6">
        <Button variant="outline" onClick={() => router.push('/user/bookings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-slate-600">
            Booking not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const serviceDetails = booking.service_details;

  return (
    <div className="py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => router.push('/user/bookings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>

        <div className="text-right">
          <h1 className="text-2xl font-bold text-slate-900">Booking Details</h1>
          <p className="text-sm text-slate-500 font-mono">#{booking.id}</p>
        </div>
      </div>

      {booking.status === 'completed' && (
        <Card>
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">
                Rate your experience
              </p>
              <p className="text-sm text-slate-600">
                Your feedback helps us improve service quality.
              </p>
            </div>
            <Button onClick={() => setRatingModalOpen(true)}>
              Rate Booking
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Booking Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-3 bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Booking Date</p>
                <p className="font-semibold text-slate-900">
                  {booking.booking_date}
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Booking Time</p>
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  <Clock3 className="h-4 w-4" /> {booking.booking_time}
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-slate-50 md:col-span-2">
                <p className="text-xs text-slate-500 mb-1">Address</p>
                {/* Address display: handle to=...&from=... format */}
                {movingAddresses ? (
                  <>
                    <p className="font-medium text-slate-900 flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span>From: {movingAddresses.from}</span>
                    </p>
                    <p className="font-medium text-slate-900 flex items-start gap-2 mt-1">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span>To: {movingAddresses.to}</span>
                    </p>
                  </>
                ) : (
                  <p className="font-medium text-slate-900 flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span>{booking.address || 'N/A'}</span>
                  </p>
                )}
                {booking.unit_or_flat && (
                  <p className="text-xs text-slate-500 mt-1 ml-6">
                    Unit / Flat:{' '}
                    <span className="font-medium text-slate-700">
                      {booking.unit_or_flat}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <p className="font-semibold text-slate-900 mb-2">
                Service Details
              </p>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  <span>
                    {serviceDetails?.name || booking.service_name || 'N/A'}
                    {serviceDetails?.category?.name || booking.service_category
                      ? ` • ${serviceDetails?.category?.name || booking.service_category}`
                      : ''}
                  </span>
                </p>
                {serviceDetails?.description && (
                  <p className="text-slate-600 whitespace-pre-wrap">
                    {serviceDetails.description}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {isMovingBooking ? (
                    <>
                      <p className="text-slate-700">
                        Rate per km:{' '}
                        <span className="font-semibold">
                          R{Number(serviceDetails?.base_price ?? 0).toFixed(2)}
                        </span>
                      </p>
                      <p className="text-slate-700">
                        Distance:{' '}
                        <span className="font-semibold">
                          {isDistanceLoading
                            ? 'Calculating...'
                            : distanceKm !== null
                              ? `${distanceKm} km`
                              : 'N/A'}
                        </span>
                      </p>
                      <p className="text-slate-700">
                        Distance Cost:{' '}
                        <span className="font-semibold">
                          R
                          {(
                            (distanceKm || 0) *
                            Number(serviceDetails?.base_price ?? 0)
                          ).toFixed(2)}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-700">
                      Base Price:{' '}
                      <span className="font-semibold">
                        R{Number(serviceDetails?.base_price ?? 0).toFixed(2)}
                      </span>
                    </p>
                  )}
                  <p className="text-slate-700">
                    Base Duration:{' '}
                    <span className="font-semibold">
                      {Number(
                        serviceDetails?.duration_minutes ??
                          booking.total_duration ??
                          0,
                      )}{' '}
                      mins
                    </span>
                  </p>
                  {booking.priority_status &&
                    Number(serviceDetails?.priority_fee ?? 0) > 0 && (
                      <p className="text-slate-700">
                        Priority Fee:{' '}
                        <span className="font-semibold">
                          R
                          {Number(serviceDetails?.priority_fee ?? 0).toFixed(2)}
                        </span>
                      </p>
                    )}
                </div>
                {distanceError && (
                  <p className="text-xs text-amber-700">{distanceError}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <p className="font-semibold text-slate-900 mb-2">
                  Additional Services
                </p>
                {selectedOptions.length > 0 ? (
                  <ul className="space-y-2 text-slate-700">
                    {selectedOptions.map((option) => (
                      <li
                        key={option.id}
                        className="text-xs rounded border p-2 bg-slate-50"
                      >
                        <p>
                          <span className="font-medium">{option.name}</span>
                        </p>
                        {option.description && (
                          <p className="text-slate-600 mt-1">
                            {option.description}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-slate-600">
                          {typeof option.price !== 'undefined' && (
                            <span>
                              Price: R{Number(option.price ?? 0).toFixed(2)}
                            </span>
                          )}
                          {typeof option.duration_minutes !== 'undefined' && (
                            <span>
                              Duration: {Number(option.duration_minutes ?? 0)}{' '}
                              mins
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">
                    No additional services selected
                  </p>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <p className="font-semibold text-slate-900 mb-2">Details</p>
                {selectedVariants.length > 0 ? (
                  <ul className="space-y-2 text-slate-700">
                    {selectedVariants.map((variant) => (
                      <li
                        key={variant.id}
                        className="text-xs rounded border p-2 bg-slate-50"
                      >
                        <p>
                          <span className="font-medium">{variant.name}</span>
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-slate-600">
                          {typeof variant.price !== 'undefined' && (
                            <span>
                              Price: R{Number(variant.price ?? 0).toFixed(2)}
                            </span>
                          )}
                          {typeof variant.duration_minutes !== 'undefined' && (
                            <span>
                              Duration: {Number(variant.duration_minutes ?? 0)}{' '}
                              mins
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">No service details selected</p>
                )}
              </div>
            </div>

            {booking.notes && (
              <div className="border rounded-lg p-4 bg-amber-50">
                <p className="font-semibold text-slate-900 mb-2">Notes</p>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {booking.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status & Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Booking Status</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColor[booking.status] || 'bg-gray-100 text-gray-700'}`}
                >
                  {booking.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Payment Status</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${paymentStatusColor[booking.payment_status] || 'bg-gray-100 text-gray-700'}`}
                >
                  {booking.payment_status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Assignment Status</span>
                {(() => {
                  // Multi-worker: show first active assignment status or fallback
                  const activeAssignment = Array.isArray(booking.assignments)
                    ? booking.assignments.find(
                        (a) =>
                          a.status === 'pending' || a.status === 'accepted',
                      )
                    : undefined;
                  const status = activeAssignment?.status || '';
                  return (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${assignmentStatusColor[status] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {status || 'N/A'}
                    </span>
                  );
                })()}
              </div>
              <div className="flex justify-between pt-2 border-t text-base font-bold">
                <span>Total Price</span>
                <span>R{Number(booking.total_price || 0).toFixed(2)}</span>
              </div>
              {booking.payfast_transaction_id && (
                <div className="pt-2 border-t text-xs text-slate-600 flex items-start gap-2">
                  <CreditCard className="h-4 w-4 mt-0.5" />
                  <span>PayFast TXN: {booking.payfast_transaction_id}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Worker(s) card: only show if booking.status === 'assigned', 'in_progress', or 'completed' */}
          {(booking.status === 'assigned' ||
            booking.status === 'in_progress' ||
            booking.status === 'completed') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Assigned Worker(s)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(() => {
                  const assignments = Array.isArray(booking.assignments)
                    ? booking.assignments
                    : [];
                  // Show all workers with assignment status 'accepted' or 'completed'
                  const assignedWorkers = assignments.filter(
                    (a) => a.status === 'accepted' || a.status === 'completed',
                  );
                  if (assignedWorkers.length === 0) {
                    return (
                      <p className="text-slate-600">No assigned workers yet.</p>
                    );
                  }
                  return assignedWorkers.map((worker) => (
                    <div key={worker.worker_id} className="mb-2">
                      <p className="font-semibold text-slate-900">
                        {worker.worker_name &&
                        typeof worker.worker_name === 'string'
                          ? worker.worker_name
                          : worker.worker_id}
                      </p>
                      <p className="text-slate-600">
                        {worker.worker_email &&
                        typeof worker.worker_email === 'string'
                          ? worker.worker_email
                          : 'No worker email'}
                      </p>
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>
          )}
        {/* Additional Work */}
        {(booking.status === 'assigned' ||
          booking.status === 'in_progress') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" /> Additional Work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {additionalWorks.length > 0 && (
                <ul className="space-y-2">
                  {additionalWorks.map((aw) => (
                    <li
                      key={aw.id}
                      className="border rounded-lg p-3 bg-slate-50 space-y-2"
                    >
                      <p className="text-slate-700 text-xs">{aw.description}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          R{Number(aw.fee).toFixed(2)}
                        </span>
                        {aw.status === 'pending_payment' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 whitespace-nowrap">
                              Pending Payment
                            </span>
                            <button
                              onClick={() =>
                                retryAdditionalWorkPayment.mutate(aw.id)
                              }
                              disabled={retryAdditionalWorkPayment.isPending}
                              className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap bg-black rounded-full text-white px-2 py-1 hover:bg-black/80 disabled:opacity-50"
                            >
                              Pay Now
                              <CreditCard className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              aw.status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {aw.status}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                className="w-full"
                onClick={() => setAdditionalWorkModalOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Additional Work
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      <Dialog open={ratingModalOpen} onOpenChange={handleRatingModalOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate your booking</DialogTitle>
            <DialogDescription>
              Share your experience with the assigned professional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Your rating
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`text-3xl leading-none transition-colors cursor-pointer ${
                      value <= rating ? 'text-amber-500' : 'text-slate-300'
                    }`}
                    aria-label={`Rate ${value} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="rating-review"
                className="text-sm font-medium text-slate-700 mb-2 block"
              >
                Review (optional)
              </label>
              <textarea
                id="rating-review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                placeholder="Tell us about your experience"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleRatingModalOpenChange(false)}
              disabled={isSubmittingRating}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitRating} disabled={isSubmittingRating}>
              {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Additional Work Modal */}
      <Dialog
        open={additionalWorkModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAwDescription('');
            setAwFee('');
          }
          setAdditionalWorkModalOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Additional Work</DialogTitle>
            <DialogDescription>
              Describe the extra work and the agreed fee. You will be redirected
              to PayFast to complete the payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="aw-description"
                className="text-sm font-medium text-slate-700 mb-1.5 block"
              >
                Description
              </label>
              <textarea
                id="aw-description"
                value={awDescription}
                onChange={(e) => setAwDescription(e.target.value)}
                rows={4}
                placeholder="Describe the additional work to be done..."
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div>
              <label
                htmlFor="aw-fee"
                className="text-sm font-medium text-slate-700 mb-1.5 block"
              >
                Agreed Fee (R)
              </label>
              <input
                id="aw-fee"
                type="number"
                min="1"
                step="0.01"
                value={awFee}
                onChange={(e) => setAwFee(e.target.value)}
                placeholder="e.g. 250.00"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdditionalWorkModalOpen(false)}
              disabled={createAdditionalWork.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdditionalWork}
              disabled={createAdditionalWork.isPending}
            >
              {createAdditionalWork.isPending
                ? 'Redirecting to payment...'
                : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingDetailsPage;
