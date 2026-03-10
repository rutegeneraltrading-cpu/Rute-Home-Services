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
} from '@/components/ui';

interface AddressDateStepProps {
  serviceId: string;
  totalDurationMinutes: number;
  addressDateData: { address: string; date: string; time: string };
  setAddressDateData: (data: {
    address: string;
    date: string;
    time: string;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const AddressDateStep = ({
  serviceId,
  totalDurationMinutes,
  addressDateData,
  setAddressDateData,
  onNext,
  onBack,
}: AddressDateStepProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const addressDateDataRef = useRef(addressDateData);
  const isApplyingGoogleSelectionRef = useRef(false);
  const [isGoogleLocationSelected, setIsGoogleLocationSelected] =
    useState<boolean>(false);
  const [locationError, setLocationError] = useState<string>('');
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
      if (place && place.formatted_address) {
        isApplyingGoogleSelectionRef.current = true;
        setAddressDateData({
          ...addressDateDataRef.current,
          address: place.formatted_address,
        });
        setIsGoogleLocationSelected(true);
        setLocationError('');
        setTimeout(() => {
          isApplyingGoogleSelectionRef.current = false;
        }, 0);
      } else if (place && place.name) {
        isApplyingGoogleSelectionRef.current = true;
        setAddressDateData({
          ...addressDateDataRef.current,
          address: place.name,
        });
        setIsGoogleLocationSelected(true);
        setLocationError('');
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

  const timeSlots = availabilityData?.available_slots || [];

  // Auto-select 9:00AM slot if available (only once)
  useEffect(() => {
    if (!hasSetDefaultTime && timeSlots.length > 0 && !addressDateData.time) {
      const nineAmSlot = timeSlots.find((slot) => slot.startsWith('9:00AM'));
      if (nineAmSlot) {
        setAddressDateData({
          ...addressDateData,
          time: nineAmSlot,
        });
        setHasSetDefaultTime(true);
      }
    }
  }, [timeSlots, hasSetDefaultTime, addressDateData, setAddressDateData]);

  const selectedTime = useMemo(() => {
    return timeSlots.includes(addressDateData.time) ? addressDateData.time : '';
  }, [addressDateData.time, timeSlots]);

  const handleNext = () => {
    if (!isGoogleLocationSelected) {
      setLocationError('Please select your address from Google suggestions.');
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
    <div>
      <h2 className="text-xl font-bold mb-4">Select Location, Date & Time</h2>
      <FormItem className="mb-6">
        <FormLabel>Location</FormLabel>
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
            }}
            disabled={!isLoaded}
          />
        </FormControl>
        {locationError && (
          <p className="text-sm text-red-600 mt-2">{locationError}</p>
        )}
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
              !addressDateData.date || isSlotsLoading || timeSlots.length === 0
            }
          >
            <SelectTrigger className="w-full">
              {selectedTime ||
                (isSlotsLoading
                  ? 'Checking available slots...'
                  : timeSlots.length === 0
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
        </FormControl>
        {isSlotsError && (
          <p className="text-sm text-red-600 mt-2">
            Unable to load worker availability. Please try again.
          </p>
        )}
        {!isSlotsLoading &&
          addressDateData.date &&
          timeSlots.length === 0 &&
          !isSlotsError && (
            <p className="text-sm text-amber-600 mt-2">
              Worker is not available on this date. Please change date.
            </p>
          )}
        {availabilityError && (
          <p className="text-sm text-red-600 mt-2">{availabilityError}</p>
        )}
      </FormItem>
      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="px-4"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={
            !(
              isGoogleLocationSelected &&
              addressDateData.address &&
              addressDateData.date &&
              selectedTime
            )
          }
          className="px-4"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AddressDateStep;
