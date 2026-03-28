import { useRef, useEffect, useState, useMemo } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useQuery } from '@tanstack/react-query';
import { FormItem, FormLabel, FormControl } from '@/components/ui/form';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  Input,
  Button,
  Switch,
} from '@/components/ui';

const ALLOWED_SERVICE_CITIES = [
  'johannesburg',
  'pretoria',
  'city of tshwane metropolitan municipality',
  'tshwane',
];

const isSupportedServiceArea = (place: google.maps.places.PlaceResult) => {
  const components = (place.address_components || []).map((component) =>
    component.long_name.toLowerCase(),
  );

  const formattedAddress = (place.formatted_address || '').toLowerCase();

  return ALLOWED_SERVICE_CITIES.some(
    (city) =>
      components.some((value) => value.includes(city)) ||
      formattedAddress.includes(city),
  );
};

interface AddressDateStepProps {
  serviceId: string;
  totalDurationMinutes: number;
  addressDateData: {
    address: string;
    unit_or_flat: string;
    date: string;
    time: string;
  };
  setAddressDateData: (data: {
    address: string;
    unit_or_flat: string;
    date: string;
    time: string;
  }) => void;
  isPriorityBooking: boolean;
  setIsPriorityBooking: (val: boolean) => void;
  serviceData: any;
  onNext: () => void;
  onBack: () => void;
}

const AddressDateStep = ({
  serviceId,
  totalDurationMinutes,
  addressDateData,
  setAddressDateData,
  isPriorityBooking,
  setIsPriorityBooking,
  serviceData,
  onNext,
  onBack,
}: AddressDateStepProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const addressDateDataRef = useRef(addressDateData);
  const isApplyingGoogleSelectionRef = useRef(false);
  const [isGoogleLocationSelected, setIsGoogleLocationSelected] =
    useState<boolean>(false);
  const [locationError, setLocationError] = useState<string>('');
  const [serviceAreaError, setServiceAreaError] = useState<string>('');
  const [availabilityError, setAvailabilityError] = useState<string>('');
  const [hasSetDefaultTime, setHasSetDefaultTime] = useState<boolean>(false);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  // Set tomorrow's date as default on mount
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    if (!addressDateData.date) {
      setAddressDateData({
        ...addressDateData,
        date: tomorrowDate,
      });
    }

    if (addressDateData.address) {
      setIsGoogleLocationSelected(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    addressDateDataRef.current = addressDateData;
  }, [addressDateData]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;
    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['geocode'],
        componentRestrictions: { country: 'za' },
      },
    );
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place && (place.formatted_address || place.name)) {
        const selectedAddress = place.formatted_address || place.name || '';
        const isAllowedArea = isSupportedServiceArea(place);

        isApplyingGoogleSelectionRef.current = true;
        setAddressDateData({
          ...addressDateDataRef.current,
          address: selectedAddress,
        });
        setIsGoogleLocationSelected(isAllowedArea);
        setLocationError('');
        setServiceAreaError(
          isAllowedArea
            ? ''
            : 'We currently provide services only in Johannesburg and Pretoria (South Africa).',
        );

        setTimeout(() => {
          isApplyingGoogleSelectionRef.current = false;
        }, 0);
      }
    });
    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isLoaded, setAddressDateData]);

  // Prevent selecting previous dates
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  const {
    data: availabilityData,
    isLoading: isSlotsLoading,
    isError: isSlotsError,
  } = useQuery({
    queryKey: [
      'workers-availability-slots',
      serviceId,
      addressDateData.date,
      totalDurationMinutes,
    ],
    queryFn: async (): Promise<{
      available_slots: string[];
      message?: string;
    }> => {
      const params = new URLSearchParams({
        service_id: serviceId,
        date: addressDateData.date,
        duration_minutes: String(totalDurationMinutes),
      });

      const response = await fetch(
        `/api/workers/availability?${params.toString()}`,
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Failed to fetch available slots');
      }

      return response.json();
    },
    enabled:
      Boolean(serviceId) &&
      Boolean(addressDateData.date) &&
      totalDurationMinutes > 0,
    staleTime: 30 * 1000,
  });

  // Filter time slots based on instant booking or normal
  const timeSlotsRaw = availabilityData?.available_slots || [];
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredTimeSlots = useMemo(() => {
    // Only filter if selected date is today
    if (addressDateData.date !== todayStr) return timeSlotsRaw;
    const now = new Date();
    // Add 30 min if instant, else 2 hours
    const minMinutes = isPriorityBooking ? 30 : 120;
    const minTime = new Date(now.getTime() + minMinutes * 60000);
    // timeSlotsRaw are strings like '9:00AM', '14:30', etc.
    return timeSlotsRaw.filter((slot) => {
      // Try to parse slot as today with slot time
      const [time, meridian] = slot.match(/\d{1,2}:\d{2}(AM|PM)?/i) || [];
      if (!time) return false;
      let [h, m] = time.split(':');
      let hour = parseInt(h, 10);
      let minute = parseInt(m, 10);
      if (meridian) {
        if (meridian.toUpperCase() === 'PM' && hour < 12) hour += 12;
        if (meridian.toUpperCase() === 'AM' && hour === 12) hour = 0;
      }
      const slotDate = new Date();
      slotDate.setHours(hour, minute, 0, 0);
      return slotDate.getTime() >= minTime.getTime();
    });
  }, [addressDateData.date, isPriorityBooking, timeSlotsRaw, todayStr]);

  // Auto-select 9:00AM slot if available (only once)
  useEffect(() => {
    if (
      !hasSetDefaultTime &&
      filteredTimeSlots.length > 0 &&
      !addressDateData.time
    ) {
      const nineAmSlot = filteredTimeSlots.find((slot) =>
        slot.startsWith('9:00AM'),
      );
      if (nineAmSlot) {
        setAddressDateData({
          ...addressDateData,
          time: nineAmSlot,
        });
        setHasSetDefaultTime(true);
      }
    }
  }, [
    filteredTimeSlots,
    hasSetDefaultTime,
    addressDateData,
    setAddressDateData,
  ]);

  const selectedTime = useMemo(() => {
    return filteredTimeSlots.includes(addressDateData.time)
      ? addressDateData.time
      : '';
  }, [addressDateData.time, filteredTimeSlots]);

  const handleNext = () => {
    if (!isGoogleLocationSelected) {
      if (!serviceAreaError) {
        setLocationError('Please select your address from Google suggestions.');
      }
      return;
    }

    if (serviceAreaError) {
      return;
    }

    if (!addressDateData.date) {
      setAvailabilityError('Please select a date first.');
      return;
    }

    if (!selectedTime) {
      setAvailabilityError(
        'No worker available for selected slot. Please choose another date/time.',
      );
      return;
    }

    if (availabilityError) {
      setAvailabilityError('');
    }

    onNext();
  };

  return (
    <div className="border rounded-lg p-4 sm:p-5 bg-white">
      <FormItem className="mb-6">
        <FormLabel>Street Address</FormLabel>
        <FormControl>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type your address and select from suggestions"
            value={addressDateData.address}
            onChange={(e) => {
              setAddressDateData({
                ...addressDateData,
                address: e.target.value,
              });
              if (!isApplyingGoogleSelectionRef.current) {
                setIsGoogleLocationSelected(false);
              }
              if (locationError) setLocationError('');
              if (serviceAreaError) setServiceAreaError('');
            }}
            disabled={!isLoaded}
          />
        </FormControl>
        {locationError && (
          <p className="text-sm text-red-600 mt-2">{locationError}</p>
        )}
        {serviceAreaError && (
          <p className="text-sm text-amber-600 mt-2">{serviceAreaError}</p>
        )}
      </FormItem>
      <FormItem className="mb-6">
        <FormLabel>Unit or Flat # (Optional)</FormLabel>
        <FormControl>
          <Input
            type="text"
            placeholder="e.g. Flat 12B / Unit 5"
            value={addressDateData.unit_or_flat}
            onChange={(e) => {
              setAddressDateData({
                ...addressDateData,
                unit_or_flat: e.target.value,
              });
            }}
          />
        </FormControl>
      </FormItem>
      <FormItem className="mb-6">
        <FormLabel>Date</FormLabel>
        <FormControl>
          <Input
            type="date"
            min={minDate}
            value={addressDateData.date}
            onChange={(e) => {
              setAddressDateData({
                ...addressDateData,
                date: e.target.value,
                time: '',
              });
              setHasSetDefaultTime(false); // Reset so 9:00AM can be auto-selected again
              if (availabilityError) setAvailabilityError('');
            }}
          />
        </FormControl>
      </FormItem>
      <FormItem className="mb-6">
        <FormLabel>
          Time ({totalDurationMinutes} min)
          {isSlotsLoading ? ' - checking availability...' : ''}
        </FormLabel>
        <FormControl>
          <Select
            value={selectedTime}
            onValueChange={(val) => {
              setAddressDateData({ ...addressDateData, time: val });
              if (availabilityError) setAvailabilityError('');
            }}
            disabled={
              !addressDateData.date ||
              isSlotsLoading ||
              filteredTimeSlots.length === 0
            }
          >
            <SelectTrigger className="w-full">
              {selectedTime ||
                (isSlotsLoading
                  ? 'Checking available slots...'
                  : filteredTimeSlots.length === 0
                    ? 'No slots available'
                    : 'Select a time slot')}
            </SelectTrigger>
            <SelectContent>
              {filteredTimeSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormControl>
        {isSlotsError && (
          <p className="text-sm text-red-600 mt-2">
            Unable to load worker availability. Please try again.
          </p>
        )}
        {!isSlotsLoading &&
          addressDateData.date &&
          filteredTimeSlots.length === 0 &&
          !isSlotsError && (
            <p className="text-sm text-amber-600 mt-2">
              Worker is not available on this date. Please change date.
            </p>
          )}
        {availabilityError && (
          <p className="text-sm text-red-600 mt-2">{availabilityError}</p>
        )}
      </FormItem>

      {/* Instant Booking Toggle Switch: Only show if selected date is today */}
      {(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return addressDateData.date === todayStr ? (
          <FormItem className="mb-6">
            <FormLabel className="flex items-center gap-3">
              <Switch
                checked={isPriorityBooking}
                onCheckedChange={setIsPriorityBooking}
                aria-label="Enable Instant Booking"
              />
              <span className={'text-sm font-medium text-black'}>
                {isPriorityBooking
                  ? `Instant Booking ON (30 min slots${
                      serviceData?.priority_fee
                        ? `, +R${Number(serviceData.priority_fee).toFixed(2)}`
                        : ', +Priority Fee'
                    })`
                  : serviceData?.priority_fee
                    ? `Enable Instant Booking (+R${Number(serviceData.priority_fee).toFixed(2)})`
                    : 'Enable Instant Booking'}
              </span>
            </FormLabel>
            <FormControl />
          </FormItem>
        ) : null;
      })()}
      <div className="flex flex-col-reverse sm:flex-row justify-between mt-8 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="px-4 w-full sm:w-auto"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={
            !(
              isGoogleLocationSelected &&
              !serviceAreaError &&
              addressDateData.address &&
              addressDateData.date &&
              selectedTime
            )
          }
          className="px-4 w-full sm:w-auto"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AddressDateStep;
