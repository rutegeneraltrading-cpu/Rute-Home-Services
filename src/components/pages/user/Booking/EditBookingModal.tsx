'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Calendar, FileText, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  Button,
  Input,
  Label,
} from '@/components/ui';
import type { Booking } from '@/lib/types/bookings';
import { useCustomerUpdateBooking } from '@/lib/client/api/bookings/bookings.mutation';

const EDIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const ALLOWED_SERVICE_CITIES = [
  'johannesburg',
  'pretoria',
  'city of tshwane metropolitan municipality',
  'tshwane',
];

const isSupportedServiceArea = (place: google.maps.places.PlaceResult) => {
  const components = (place.address_components || []).map((c) =>
    c.long_name.toLowerCase(),
  );
  const formatted = (place.formatted_address || '').toLowerCase();
  return ALLOWED_SERVICE_CITIES.some(
    (city) =>
      components.some((v) => v.includes(city)) || formatted.includes(city),
  );
};

interface EditBookingModalProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Inner form — isolated so the `key` trick correctly resets all state
 * when the modal opens for a new booking.
 */
const EditBookingForm = ({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) => {
  const updateMutation = useCustomerUpdateBooking(booking.id);

  // Form state
  const [address, setAddress] = useState(booking.address || '');
  const [unitOrFlat, setUnitOrFlat] = useState(booking.unit_or_flat || '');
  const [notes, setNotes] = useState(booking.notes || '');
  const [date, setDate] = useState(booking.booking_date || '');
  const [time, setTime] = useState(booking.booking_time || '');

  // Address validation
  const [isGoogleLocationSelected, setIsGoogleLocationSelected] = useState(
    Boolean(booking.address),
  );
  const [locationError, setLocationError] = useState('');
  const [serviceAreaError, setServiceAreaError] = useState('');
  const [hasSetDefaultTime, setHasSetDefaultTime] = useState(false);

  // Countdown
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [windowExpired, setWindowExpired] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const isApplyingGoogleRef = useRef(false);

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  // Countdown timer
  useEffect(() => {
    const createdAt = new Date(booking.created_at).getTime();
    const deadline = createdAt + EDIT_WINDOW_MS;

    const tick = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setWindowExpired(true);
        setTimeRemaining(0);
      } else {
        setWindowExpired(false);
        setTimeRemaining(remaining);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [booking.created_at]);

  // Google Places autocomplete
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { types: ['geocode'], componentRestrictions: { country: 'za' } },
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place && (place.formatted_address || place.name)) {
        const selected = place.formatted_address || place.name || '';
        const allowed = isSupportedServiceArea(place);

        isApplyingGoogleRef.current = true;
        setAddress(selected);
        setIsGoogleLocationSelected(allowed);
        setLocationError('');
        setServiceAreaError(
          allowed
            ? ''
            : 'We currently service only Johannesburg and Pretoria (South Africa).',
        );
        setTimeout(() => {
          isApplyingGoogleRef.current = false;
        }, 0);
      }
    });

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [mapsLoaded]);

  const minDate = new Date().toISOString().split('T')[0];

  // Multi-worker: Find the first active assignment (pending or accepted)
  const activeAssignment = Array.isArray(booking.assignments)
    ? booking.assignments.find(
        (a) => a.status === 'pending' || a.status === 'accepted',
      )
    : undefined;
  const hasActiveWorker = Boolean(activeAssignment);

  // Availability query
  const {
    data: availabilityData,
    isLoading: isSlotsLoading,
    isError: isSlotsError,
  } = useQuery({
    queryKey: [
      'edit-booking-availability',
      booking.service_id,
      date,
      booking.total_duration,
      hasActiveWorker ? activeAssignment?.worker_id : null,
    ],
    queryFn: async (): Promise<{ available_slots: string[] }> => {
      const params = new URLSearchParams({
        service_id: booking.service_id,
        date,
        duration_minutes: String(booking.total_duration),
      });
      if (hasActiveWorker && activeAssignment?.worker_id) {
        params.set('worker_id', activeAssignment.worker_id);
      }
      const res = await fetch(`/api/workers/availability?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch slots');
      return res.json();
    },
    enabled:
      Boolean(booking.service_id) &&
      Boolean(date) &&
      booking.total_duration > 0,
    staleTime: 30_000,
  });

  const timeSlots = useMemo(
    () => availabilityData?.available_slots ?? [],
    [availabilityData],
  );

  // Auto-select 9:00AM when slots first load for a given date
  useEffect(() => {
    if (hasSetDefaultTime || timeSlots.length === 0 || time) return;
    const nineAm = timeSlots.find((s) => s.startsWith('9:00AM'));
    if (nineAm) {
      setTime(nineAm);
      setHasSetDefaultTime(true);
    }
    // intentionally omit `time` to avoid re-triggering after manual selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSlots, hasSetDefaultTime]);

  const selectedTime = time;

  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isSubmitting = updateMutation.isPending;

  const handleSubmit = async () => {
    if (windowExpired || isSubmitting) return;

    if (!isGoogleLocationSelected) {
      if (!serviceAreaError) {
        setLocationError('Please select your address from Google suggestions.');
      }
      return;
    }
    if (serviceAreaError) return;

    const payload: Record<string, string> = {};
    if (address !== booking.address) payload.address = address;
    if (unitOrFlat !== (booking.unit_or_flat || ''))
      payload.unit_or_flat = unitOrFlat;
    if (notes !== (booking.notes || '')) payload.notes = notes;
    if (date !== booking.booking_date) payload.booking_date = date;
    if (selectedTime && selectedTime !== booking.booking_time)
      payload.booking_time = selectedTime;

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    await updateMutation.mutateAsync(payload, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Edit window countdown */}
      {timeRemaining !== null && (
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            windowExpired
              ? 'bg-red-50 border border-red-200 text-red-700'
              : timeRemaining < 5 * 60 * 1000
                ? 'bg-amber-50 border border-amber-200 text-amber-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}
        >
          <Clock className="h-4 w-4 shrink-0" />
          {windowExpired ? (
            <span>
              Edit window has expired. Bookings can only be edited within 1 hour
              of creation.
            </span>
          ) : (
            <span>
              Edit window closes in{' '}
              <span className="font-semibold tabular-nums">
                {formatTimeRemaining(timeRemaining)}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Worker notice */}
      {hasActiveWorker && (
        <div className="flex items-start gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 text-sm text-indigo-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            A worker is assigned to this booking. Available time slots show only
            times when your assigned worker is free.
          </span>
        </div>
      )}

      {/* Notes */}
      <div>
        <Label className="flex items-center gap-1.5 mb-2 text-sm font-medium">
          <FileText className="h-4 w-4" />
          Notes (Optional)
        </Label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Please ring the bell, parking in basement."
          rows={3}
          disabled={windowExpired || isSubmitting}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 disabled:opacity-50 disabled:bg-gray-50"
        />
      </div>

      {/* Street Address */}
      <div>
        <Label className="flex items-center gap-1.5 mb-2 text-sm font-medium">
          <MapPin className="h-4 w-4" />
          Street Address
        </Label>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type your address and select from suggestions"
          value={address}
          disabled={!mapsLoaded || windowExpired || isSubmitting}
          onChange={(e) => {
            setAddress(e.target.value);
            if (!isApplyingGoogleRef.current) {
              setIsGoogleLocationSelected(false);
            }
            if (locationError) setLocationError('');
            if (serviceAreaError) setServiceAreaError('');
          }}
        />
        {locationError && (
          <p className="text-sm text-red-600 mt-1">{locationError}</p>
        )}
        {serviceAreaError && (
          <p className="text-sm text-amber-600 mt-1">{serviceAreaError}</p>
        )}
      </div>

      {/* Unit or Flat */}
      <div>
        <Label className="mb-2 text-sm font-medium block">
          Unit or Flat # (Optional)
        </Label>
        <Input
          type="text"
          placeholder="e.g. Flat 12B / Unit 5"
          value={unitOrFlat}
          disabled={windowExpired || isSubmitting}
          onChange={(e) => setUnitOrFlat(e.target.value)}
        />
      </div>

      {/* Date */}
      <div>
        <Label className="flex items-center gap-1.5 mb-2 text-sm font-medium">
          <Calendar className="h-4 w-4" />
          Date
        </Label>
        <Input
          type="date"
          min={minDate}
          value={date}
          disabled={windowExpired || isSubmitting}
          onChange={(e) => {
            setDate(e.target.value);
            setTime('');
            setHasSetDefaultTime(false);
          }}
        />
      </div>

      {/* Time */}
      <div>
        <Label className="flex items-center gap-1.5 mb-2 text-sm font-medium">
          <Clock className="h-4 w-4" />
          Time ({booking.total_duration} min)
          {isSlotsLoading && (
            <span className="text-xs text-gray-500 font-normal ml-1">
              — checking availability…
            </span>
          )}
        </Label>
        <Select
          value={selectedTime}
          onValueChange={(val) => setTime(val)}
          disabled={
            windowExpired ||
            isSubmitting ||
            !date ||
            isSlotsLoading ||
            timeSlots.length === 0
          }
        >
          <SelectTrigger className="w-full">
            {selectedTime ||
              (isSlotsLoading
                ? 'Checking available slots…'
                : timeSlots.length === 0 && date
                  ? 'No slots available'
                  : 'Select a time slot')}
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map((slot) => (
              <SelectItem key={slot} value={slot}>
                {slot}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isSlotsError && (
          <p className="text-sm text-red-600 mt-1">
            Unable to load availability. Please try again.
          </p>
        )}
        {!isSlotsLoading && date && timeSlots.length === 0 && !isSlotsError && (
          <p className="text-sm text-amber-600 mt-1">
            {hasActiveWorker
              ? 'Your assigned worker is not available on this date. Please choose another date.'
              : 'No workers available on this date. Please choose another date.'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={
            windowExpired ||
            isSubmitting ||
            !isGoogleLocationSelected ||
            Boolean(serviceAreaError) ||
            !date ||
            !selectedTime
          }
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Updating…' : 'Update Booking'}
        </Button>
      </div>
    </div>
  );
};

const EditBookingModal = ({
  booking,
  open,
  onOpenChange,
}: EditBookingModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Update your booking details —{' '}
            <span className="font-medium text-gray-700">
              {booking.service_name || 'Service Booking'}
            </span>
          </DialogDescription>
        </DialogHeader>
        {/*
         * key forces full re-mount / state reset when the modal opens
         * for a different booking or reopens after closing.
         */}
        <EditBookingForm
          key={`${booking.id}-${String(open)}`}
          booking={booking}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingModal;
