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
  distanceKm: number | null;
  setDistanceKm: (km: number | null) => void;
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
  distanceKm,
  setDistanceKm,
  onNext,
  onBack,
}: AddressDateStepProps) => {
  // Detect if category is moving-removals
  const isMovingRemovals = serviceData?.category?.slug === 'moving-removals';
  // Separate state for from/to fields if moving-removals
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [fromLocationError, setFromLocationError] = useState('');
  const [toLocationError, setToLocationError] = useState('');
  const [isFromGoogleLocationSelected, setIsFromGoogleLocationSelected] =
    useState(false);
  const [isToGoogleLocationSelected, setIsToGoogleLocationSelected] =
    useState(false);
  const [fromLatLng, setFromLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [toLatLng, setToLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState('');
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
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

    if (isMovingRemovals) {
      // If address field already has to/from, split and set
      if (
        addressDateData.address &&
        addressDateData.address.includes('to=') &&
        addressDateData.address.includes('from=')
      ) {
        const params = new URLSearchParams(addressDateData.address);
        setToAddress(params.get('to') || '');
        setFromAddress(params.get('from') || '');
        setIsToGoogleLocationSelected(!!params.get('to'));
        setIsFromGoogleLocationSelected(!!params.get('from'));
      }
    } else {
      if (addressDateData.address) {
        setIsGoogleLocationSelected(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    addressDateDataRef.current = addressDateData;
  }, [addressDateData]);

  // Google Autocomplete for normal address
  useEffect(() => {
    if (!isLoaded || !inputRef.current || isMovingRemovals) return;
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
  }, [isLoaded, setAddressDateData, isMovingRemovals]);

  // Google Autocomplete for moving-removals: FROM
  useEffect(() => {
    if (!isLoaded || !fromInputRef.current || !isMovingRemovals) return;
    const autocomplete = new window.google.maps.places.Autocomplete(
      fromInputRef.current,
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
        setFromAddress(selectedAddress);
        setIsFromGoogleLocationSelected(isAllowedArea);
        setFromLocationError(
          isAllowedArea
            ? ''
            : 'We currently provide services only in Johannesburg and Pretoria (South Africa).',
        );
        const loc = place.geometry?.location;
        if (loc) {
          setFromLatLng({ lat: loc.lat(), lng: loc.lng() });
        } else {
          setFromLatLng(null);
          setDistanceKm(null);
        }
      }
    });
    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isLoaded, isMovingRemovals, setDistanceKm]);

  // Google Autocomplete for moving-removals: TO
  useEffect(() => {
    if (!isLoaded || !toInputRef.current || !isMovingRemovals) return;
    const autocomplete = new window.google.maps.places.Autocomplete(
      toInputRef.current,
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
        setToAddress(selectedAddress);
        setIsToGoogleLocationSelected(isAllowedArea);
        setToLocationError(
          isAllowedArea
            ? ''
            : 'We currently provide services only in Johannesburg and Pretoria (South Africa).',
        );
        const loc = place.geometry?.location;
        if (loc) {
          setToLatLng({ lat: loc.lat(), lng: loc.lng() });
        } else {
          setToLatLng(null);
          setDistanceKm(null);
        }
      }
    });
    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isLoaded, isMovingRemovals, setDistanceKm]);

  // Calculate driving distance between from/to addresses for moving-removals
  useEffect(() => {
    if (!isLoaded || !fromLatLng || !toLatLng || !isMovingRemovals) {
      if (isMovingRemovals && (!fromLatLng || !toLatLng)) {
        setDistanceKm(null);
      }
      return;
    }
    setIsCalculatingDistance(true);
    setDistanceError('');
    const svc = new window.google.maps.DistanceMatrixService();
    svc.getDistanceMatrix(
      {
        origins: [
          new window.google.maps.LatLng(fromLatLng.lat, fromLatLng.lng),
        ],
        destinations: [
          new window.google.maps.LatLng(toLatLng.lat, toLatLng.lng),
        ],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        setIsCalculatingDistance(false);
        if (
          status === 'OK' &&
          response?.rows[0]?.elements[0]?.status === 'OK'
        ) {
          const meters = response.rows[0].elements[0].distance.value;
          setDistanceKm(Math.ceil(meters / 1000));
        } else {
          setDistanceError(
            'Could not calculate distance. Please re-select your addresses.',
          );
          setDistanceKm(null);
        }
      },
    );
  }, [isLoaded, fromLatLng, toLatLng, isMovingRemovals, setDistanceKm]);

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
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredTimeSlots = useMemo(() => {
    const timeSlotsRaw = availabilityData?.available_slots || [];
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
      const [h, m] = time.split(':');
      let hour = parseInt(h, 10);
      const minute = parseInt(m, 10);
      if (meridian) {
        if (meridian.toUpperCase() === 'PM' && hour < 12) hour += 12;
        if (meridian.toUpperCase() === 'AM' && hour === 12) hour = 0;
      }
      const slotDate = new Date();
      slotDate.setHours(hour, minute, 0, 0);
      return slotDate.getTime() >= minTime.getTime();
    });
  }, [addressDateData.date, isPriorityBooking, availabilityData, todayStr]);

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
    if (isMovingRemovals) {
      let hasError = false;
      if (!isToGoogleLocationSelected) {
        setToLocationError(
          'Please select your "To" address from Google suggestions.',
        );
        hasError = true;
      }
      if (!isFromGoogleLocationSelected) {
        setFromLocationError(
          'Please select your "From" address from Google suggestions.',
        );
        hasError = true;
      }
      if (toLocationError || fromLocationError) {
        hasError = true;
      }
      if (!addressDateData.date) {
        setAvailabilityError('Please select a date first.');
        hasError = true;
      }
      if (!selectedTime) {
        setAvailabilityError(
          'No worker available for selected slot. Please choose another date/time.',
        );
        hasError = true;
      }
      if (!distanceKm && !isCalculatingDistance) {
        setDistanceError(
          'Please wait for the distance to be calculated, or re-select your addresses.',
        );
        hasError = true;
      }
      if (hasError) return;
      // Save as to=...&from=... in address
      setAddressDateData({
        ...addressDateData,
        address: `to=${encodeURIComponent(toAddress)}&from=${encodeURIComponent(fromAddress)}`,
      });
      if (availabilityError) setAvailabilityError('');
      onNext();
      return;
    }
    // ...existing code for normal address...
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
      {isMovingRemovals ? (
        <>
          <FormItem className="mb-6">
            <FormLabel>To</FormLabel>
            <FormControl>
              <Input
                ref={toInputRef}
                type="text"
                placeholder="Type destination address and select from suggestions"
                value={toAddress}
                onChange={(e) => {
                  const value = e.target.value;
                  setToAddress(value);
                  setIsToGoogleLocationSelected(false);
                  setToLatLng(null);
                  setDistanceKm(null);
                  // Service area validation on manual input
                  const isAllowed = ALLOWED_SERVICE_CITIES.some((city) =>
                    value.toLowerCase().includes(city),
                  );
                  if (!value) {
                    setToLocationError('');
                  } else if (!isAllowed) {
                    setToLocationError(
                      'We currently provide services only in Johannesburg and Pretoria (South Africa).',
                    );
                  } else {
                    setToLocationError('');
                  }
                }}
                disabled={!isLoaded}
              />
            </FormControl>
            {toLocationError && (
              <p className="text-sm text-red-600 mt-2">{toLocationError}</p>
            )}
          </FormItem>
          <FormItem className="mb-6">
            <FormLabel>From</FormLabel>
            <FormControl>
              <Input
                ref={fromInputRef}
                type="text"
                placeholder="Type pickup address and select from suggestions"
                value={fromAddress}
                onChange={(e) => {
                  const value = e.target.value;
                  setFromAddress(value);
                  setIsFromGoogleLocationSelected(false);
                  setFromLatLng(null);
                  setDistanceKm(null);
                  // Service area validation on manual input
                  const isAllowed = ALLOWED_SERVICE_CITIES.some((city) =>
                    value.toLowerCase().includes(city),
                  );
                  if (!value) {
                    setFromLocationError('');
                  } else if (!isAllowed) {
                    setFromLocationError(
                      'We currently provide services only in Johannesburg and Pretoria (South Africa).',
                    );
                  } else {
                    setFromLocationError('');
                  }
                }}
                disabled={!isLoaded}
              />
            </FormControl>
            {fromLocationError && (
              <p className="text-sm text-red-600 mt-2">{fromLocationError}</p>
            )}
          </FormItem>

          {/* Distance calculation result */}
          {(fromLatLng || toLatLng) && (
            <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
              {isCalculatingDistance ? (
                <p className="text-slate-500">Calculating distance...</p>
              ) : distanceKm !== null ? (
                <p className="text-green-700 font-semibold">
                  Estimated distance: ~{distanceKm} km
                  {serviceData?.base_price
                    ? ` · Rate: R${serviceData.base_price}/km`
                    : ''}
                </p>
              ) : distanceError ? (
                <p className="text-red-600">{distanceError}</p>
              ) : null}
            </div>
          )}
        </>
      ) : (
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
      )}
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
            isMovingRemovals
              ? !(
                  isToGoogleLocationSelected &&
                  isFromGoogleLocationSelected &&
                  toAddress &&
                  fromAddress &&
                  addressDateData.date &&
                  selectedTime &&
                  distanceKm !== null &&
                  !isCalculatingDistance
                )
              : !(
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
