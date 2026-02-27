import { useRef, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface AddressDateStepProps {
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
  addressDateData,
  setAddressDateData,
  onNext,
  onBack,
}: AddressDateStepProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

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
        setAddressDateData({
          ...addressDateData,
          address: place.formatted_address,
        });
      } else if (place && place.name) {
        setAddressDateData({ ...addressDateData, address: place.name });
      }
    });
    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isLoaded, addressDateData, setAddressDateData]);

  // Generate 1-hour interval time slots for a day
  const getTimeSlots = () => {
    const slots: string[] = [];
    let start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 24; i++) {
      const end = new Date(start.getTime() + 60 * 60000);
      const format = (d: Date) => {
        const h = d.getHours() % 12 || 12;
        const m = d.getMinutes().toString().padStart(2, '0');
        const ampm = d.getHours() < 12 ? 'AM' : 'PM';
        return `${h}:${m}${ampm}`;
      };
      slots.push(`${format(start)} to ${format(end)}`);
      start = end;
    }
    return slots;
  };

  // Prevent selecting previous dates
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  // Prevent selecting previous time if today is selected
  const isToday = addressDateData.date === minDate;
  const now = new Date();
  const getFilteredTimeSlots = () => {
    const slots = getTimeSlots();
    if (!isToday) return slots;
    // Only show slots that end after now
    return slots.filter((slot) => {
      const [, end] = slot.split(' to ');
      const [eh, emamp] = end.split(':');
      const em = emamp.slice(0, 2);
      const ampm = emamp.slice(2);
      let hour = parseInt(eh, 10);
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      const minute = parseInt(em, 10);
      const slotEnd = new Date();
      slotEnd.setHours(hour, minute, 0, 0);
      return slotEnd > now;
    });
  };

  // Set default time slot if not set
  const defaultTimeSlot = '9:00AM to 10:00AM';
  const timeSlots = getFilteredTimeSlots();
  // If user selects a date and time is empty, set default
  useEffect(() => {
    if (
      addressDateData.date &&
      !addressDateData.time &&
      timeSlots.includes(defaultTimeSlot)
    ) {
      setAddressDateData({ ...addressDateData, time: defaultTimeSlot });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressDateData.date, timeSlots.length]);

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
            onChange={(e) =>
              setAddressDateData({
                ...addressDateData,
                address: e.target.value,
              })
            }
            disabled={!isLoaded}
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
            onChange={(e) =>
              setAddressDateData({
                ...addressDateData,
                date: e.target.value,
                time: '',
              })
            }
          />
        </FormControl>
      </FormItem>
      <FormItem className="mb-6">
        <FormLabel>Time</FormLabel>
        <FormControl>
          <Select
            value={addressDateData.time}
            onValueChange={(val) =>
              setAddressDateData({ ...addressDateData, time: val })
            }
            disabled={!addressDateData.date}
          >
            <SelectTrigger className="w-full">
              {addressDateData.time || 'Select a time slot'}
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
      </FormItem>
      <div className="flex justify-between mt-8">
        <button
          type="button"
          className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
          onClick={onNext}
          disabled={
            !(
              addressDateData.address &&
              addressDateData.date &&
              addressDateData.time
            )
          }
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AddressDateStep;
