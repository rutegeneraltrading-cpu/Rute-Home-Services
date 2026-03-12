'use client';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  CreditCard,
  MapPin,
  User,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Loading } from '@/components/common';
import { useGetBooking } from '@/lib/client/api/bookings/bookings.query';
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

const BookingDetails = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookingId = params?.id;

  const { data: booking, isLoading, isError } = useGetBooking(bookingId || '');

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

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (isError || !booking) {
    return (
      <div className="py-10 space-y-6">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/bookings')}
        >
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
  const ratingValue = Number(booking.rating_value || 0);
  const safeRatingValue = Math.max(0, Math.min(5, Math.round(ratingValue)));
  const ratingStars = safeRatingValue
    ? `${'★'.repeat(safeRatingValue)}${'☆'.repeat(5 - safeRatingValue)}`
    : null;

  return (
    <div className="py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/bookings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>

        <div className="text-right">
          <h1 className="text-2xl font-bold text-slate-900">Booking Details</h1>
          <p className="text-sm text-slate-500 font-mono">#{booking.id}</p>
        </div>
      </div>

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
              <div className="rounded-lg border p-3 bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Address</p>
                <p className="font-medium text-slate-900 flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>{booking.address || 'N/A'}</span>
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Service Duration</p>
                <p className="font-semibold text-slate-900">
                  {Number(booking.total_duration || 0)} mins
                </p>
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
                <p className="text-slate-600">
                  Service ID: {booking.service_id}
                </p>
                {serviceDetails?.slug && (
                  <p className="text-slate-600">Slug: {serviceDetails.slug}</p>
                )}
                {serviceDetails?.description && (
                  <p className="text-slate-600 whitespace-pre-wrap">
                    {serviceDetails.description}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <p className="text-slate-700">
                    Base Price:{' '}
                    <span className="font-semibold">
                      R{Number(serviceDetails?.base_price ?? 0).toFixed(2)}
                    </span>
                  </p>
                  <p className="text-slate-700">
                    Base Duration:{' '}
                    <span className="font-semibold">
                      {Number(serviceDetails?.duration_minutes ?? 0)} mins
                    </span>
                  </p>
                  <p className="text-slate-700">
                    Charge Type:{' '}
                    <span className="font-semibold capitalize">
                      {serviceDetails?.category?.charge_type || 'N/A'}
                    </span>
                  </p>
                  <p className="text-slate-700">
                    Service Active:{' '}
                    <span className="font-semibold">
                      {serviceDetails?.is_active ? 'Yes' : 'No'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <p className="font-semibold text-slate-900 mb-2">
                  Selected Options
                </p>
                {selectedOptions.length > 0 ? (
                  <ul className="space-y-2 text-slate-700">
                    {selectedOptions.map((option) => (
                      <li
                        key={option.id}
                        className="text-xs rounded border p-2 bg-slate-50"
                      >
                        <p>
                          <span className="font-medium">{option.name}</span>{' '}
                          <span className="font-mono text-slate-500">
                            ({option.id})
                          </span>
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
                          {option.type && <span>Type: {option.type}</span>}
                          {typeof option.is_required !== 'undefined' && (
                            <span>
                              Required: {option.is_required ? 'Yes' : 'No'}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">No options selected</p>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <p className="font-semibold text-slate-900 mb-2">
                  Selected Variants
                </p>
                {selectedVariants.length > 0 ? (
                  <ul className="space-y-2 text-slate-700">
                    {selectedVariants.map((variant) => (
                      <li
                        key={variant.id}
                        className="text-xs rounded border p-2 bg-slate-50"
                      >
                        <p>
                          <span className="font-medium">{variant.name}</span>{' '}
                          <span className="font-mono text-slate-500">
                            ({variant.id})
                          </span>
                        </p>
                        {variant.service_option_name && (
                          <p className="text-slate-600 mt-1">
                            Option: {variant.service_option_name}
                          </p>
                        )}
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
                          {variant.type && <span>Type: {variant.type}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">No variants selected</p>
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
          {safeRatingValue > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Rating</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <>
                  <p className="text-amber-500 text-xl leading-none">
                    {ratingStars}
                  </p>
                  <p className="font-semibold text-slate-900">
                    {ratingValue}/5
                  </p>
                  {booking.rating_review ? (
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {booking.rating_review}
                    </p>
                  ) : (
                    <p className="text-slate-500">No review text provided.</p>
                  )}
                  {booking.rating_submitted_at && (
                    <p className="text-xs text-slate-500">
                      Submitted:{' '}
                      {new Date(booking.rating_submitted_at).toLocaleString()}
                    </p>
                  )}
                </>
              </CardContent>
            </Card>
          )}

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
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${assignmentStatusColor[booking.assignment_status || ''] || 'bg-gray-100 text-gray-700'}`}
                >
                  {booking.assignment_status || 'N/A'}
                </span>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold text-slate-900">
                {booking.customer_name || 'N/A'}
              </p>
              <p className="text-slate-600">
                {booking.customer_email || 'N/A'}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                {booking.customer_phone || 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" /> Assigned Worker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold text-slate-900">
                {booking.assigned_worker_name || 'N/A'}
              </p>
              <p className="text-slate-600">
                {booking.assigned_worker_email || 'No email'}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                {booking.assigned_worker_phone || 'No worker assigned'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
