'use client';

import { useState, useMemo } from 'react';
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
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
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

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, boolean>
  >({});

  // Category-specific fields
  const [propertySize, setPropertySize] = useState(''); // Home Cleaning, Fumigation
  const [wallArea, setWallArea] = useState(''); // Painting
  const [poolSize, setPoolSize] = useState(''); // Pool Cleaning
  const [pestType, setPestType] = useState(''); // Fumigation
  const [emergencyType, setEmergencyType] = useState('Normal'); // Fumigation
  const [loadSize, setLoadSize] = useState(''); // Rubble Removal
  const [locksmithType, setLocksmithType] = useState(''); // Locksmith
  const [locksmithSubType, setLocksmithSubType] = useState(''); // Locksmith
  const [truckSize, setTruckSize] = useState(''); // Moving
  const [moveDistance, setMoveDistance] = useState(''); // Moving
  const [specialItem, setSpecialItem] = useState(''); // Moving
  // Worker availability
  const [workerAvailable, setWorkerAvailable] = useState(true);
  const [checkingWorker, setCheckingWorker] = useState(false);
  const [workerError, setWorkerError] = useState('');
  // Location picker state
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number | null;
    lng: number | null;
    city: string;
    address: string;
  }>({
    lat: null,
    lng: null,
    city: '',
    address: '',
  });
  const [locationError, setLocationError] = useState('');
  // autocomplete declaration already exists above, remove duplicate

  // Load Google Maps JS API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'Hello',
    libraries: ['places'],
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

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

  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  // Removed address auto-select logic

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

  // Removed selectedAddress logic; use selectedLocation for booking summary

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
                        onClick={() => {
                          setSelectedServiceId(service.id);
                          setSelectedOptions({}); // Clear options when service changes
                        }}
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
              <div className="space-y-6">
                {/* Category-specific fields */}
                {category?.name === 'Home Cleaning' && (
                  <div>
                    <label className="block font-medium mb-2">
                      Property Size
                    </label>
                    <select
                      className="border rounded px-3 py-2 w-full"
                      value={propertySize}
                      onChange={(e) => setPropertySize(e.target.value)}
                    >
                      <option value="">Select size</option>
                      <option>Studio</option>
                      <option>1-Bed</option>
                      <option>2-Bed</option>
                      <option>3-Bed</option>
                    </select>
                  </div>
                )}
                {category?.name === 'Painting' && (
                  <div>
                    <label className="block font-medium mb-2">
                      Wall Area (m²)
                    </label>
                    <input
                      type="number"
                      className="border rounded px-3 py-2 w-full"
                      value={wallArea}
                      onChange={(e) => setWallArea(e.target.value)}
                      min={1}
                    />
                  </div>
                )}
                {category?.name === 'Pool Cleaning' && (
                  <div>
                    <label className="block font-medium mb-2">Pool Size</label>
                    <select
                      className="border rounded px-3 py-2 w-full"
                      value={poolSize}
                      onChange={(e) => setPoolSize(e.target.value)}
                    >
                      <option value="">Select size</option>
                      <option>Small Pool</option>
                      <option>Medium Pool</option>
                      <option>Large Pool</option>
                    </select>
                  </div>
                )}
                {category?.name === 'Fumigation (Pest Control)' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-2">
                        Pest Type
                      </label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={pestType}
                        onChange={(e) => setPestType(e.target.value)}
                      >
                        <option value="">Select pest</option>
                        <option>Ants</option>
                        <option>Cockroaches</option>
                        <option>Fleas</option>
                        <option>Rodents</option>
                        <option>Termites</option>
                        <option>Bed Bugs</option>
                        <option>General Preventative Spray</option>
                        <option>Commercial Fumigation</option>
                        <option>Emergency Infestation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-2">
                        Property Size
                      </label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={propertySize}
                        onChange={(e) => setPropertySize(e.target.value)}
                      >
                        <option value="">Select size</option>
                        <option>Studio / 1 Bed (&lt;50m²)</option>
                        <option>2 Bed (50–100m²)</option>
                        <option>3 Bed (100–150m²)</option>
                        <option>4+ Bed (150m²+)</option>
                        <option>Small Property</option>
                        <option>Medium Property</option>
                        <option>Large Property</option>
                        <option>Single Room</option>
                        <option>Full Apartment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-2">
                        Emergency Type
                      </label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={emergencyType}
                        onChange={(e) => setEmergencyType(e.target.value)}
                      >
                        <option>Normal</option>
                        <option>Emergency</option>
                      </select>
                    </div>
                  </div>
                )}
                {category?.name === 'Rubble Removal' && (
                  <div>
                    <label className="block font-medium mb-2">Load Size</label>
                    <select
                      className="border rounded px-3 py-2 w-full"
                      value={loadSize}
                      onChange={(e) => setLoadSize(e.target.value)}
                    >
                      <option value="">Select load size</option>
                      <option>Small Load (Bakkie)</option>
                      <option>Medium Load (Trailer)</option>
                      <option>Large Load (4-Ton Truck)</option>
                      <option>Extra Large (8-Ton)</option>
                      <option>Custom / Bulk Removal</option>
                    </select>
                  </div>
                )}
                {category?.name === 'Locksmith' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-2">
                        Locksmith Type
                      </label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={locksmithType}
                        onChange={(e) => {
                          setLocksmithType(e.target.value);
                          setLocksmithSubType('');
                        }}
                      >
                        <option value="">Select type</option>
                        <option>Residential Locksmith</option>
                        <option>Commercial Locksmith</option>
                        <option>Automotive Locksmith</option>
                      </select>
                    </div>
                    {locksmithType && (
                      <div>
                        <label className="block font-medium mb-2">
                          Service
                        </label>
                        <select
                          className="border rounded px-3 py-2 w-full"
                          value={locksmithSubType}
                          onChange={(e) => setLocksmithSubType(e.target.value)}
                        >
                          <option value="">Select service</option>
                          {locksmithType === 'Residential Locksmith' &&
                            [
                              'Door Unlocking (House / Apartment)',
                              'Lock Replacement',
                              'Lock Installation (New Door)',
                              'Rekeying Locks',
                              'Gate Lock Repair',
                              'Garage Door Lock',
                              'Smart Lock Installation',
                            ].map((opt) => <option key={opt}>{opt}</option>)}
                          {locksmithType === 'Commercial Locksmith' &&
                            [
                              'Office Door Unlocking',
                              'Lock Replacement',
                              'Master Key System Setup',
                              'Access Control Lock',
                              'Filing Cabinet Unlock',
                              'Emergency Lockout',
                            ].map((opt) => <option key={opt}>{opt}</option>)}
                          {locksmithType === 'Automotive Locksmith' &&
                            [
                              'Car Unlocking',
                              'Lost Car Key Replacement',
                              'Key Programming',
                              'Broken Key Extraction',
                              'Ignition Repair',
                            ].map((opt) => <option key={opt}>{opt}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}
                {category?.name === 'Moving / Removals' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-2">
                        Truck Size
                      </label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={truckSize}
                        onChange={(e) => setTruckSize(e.target.value)}
                      >
                        <option value="">Select truck</option>
                        <option>H1 / Small Van</option>
                        <option>2 Ton Truck</option>
                        <option>4 Ton Truck</option>
                        <option>8 Ton Truck</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-2">Distance</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={moveDistance}
                        onChange={(e) => setMoveDistance(e.target.value)}
                      >
                        <option value="">Select distance</option>
                        <option>0-10 km (included)</option>
                        <option>10-30 km (+R700)</option>
                        <option>30-60 km (+R1,500)</option>
                        <option>60-100 km (+R2,500)</option>
                        <option>100km+ (Custom Quote)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-2">
                        Special Item
                      </label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={specialItem}
                        onChange={(e) => setSpecialItem(e.target.value)}
                      >
                        <option value="">None</option>
                        <option>Piano</option>
                        <option>Pool Table</option>
                        <option>Safe</option>
                        <option>Double Door Fridge</option>
                        <option>Heavy Machinery (Custom Quote)</option>
                      </select>
                    </div>
                  </div>
                )}
                {/* ...existing options UI... */}
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
                {/* Location Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Select Location
                  </h3>
                  {/* Google Maps location picker placeholder */}
                  <div className="mb-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-slate-600 mb-2">
                        Type your address below (Johannesburg or Pretoria only):
                      </p>
                      {isLoaded ? (
                        <Autocomplete
                          onLoad={(ac) =>
                            setAutocomplete(
                              ac as google.maps.places.Autocomplete,
                            )
                          }
                          onPlaceChanged={() => {
                            if (!autocomplete) return;
                            const place = autocomplete.getPlace();
                            const address = place.formatted_address || '';
                            const city =
                              (place.address_components || []).find(
                                (comp: google.maps.GeocoderAddressComponent) =>
                                  comp.types.includes('locality'),
                              )?.long_name || '';
                            const lat =
                              typeof place.geometry?.location?.lat ===
                              'function'
                                ? place.geometry.location.lat()
                                : null;
                            const lng =
                              typeof place.geometry?.location?.lng ===
                              'function'
                                ? place.geometry.location.lng()
                                : null;
                            // Validate city
                            if (
                              city.toLowerCase().includes('johannesburg') ||
                              city.toLowerCase().includes('pretoria')
                            ) {
                              setLocationError('');
                              setSelectedLocation({ lat, lng, city, address });
                            } else {
                              setLocationError(
                                'Currently, our service is only available in Johannesburg and Pretoria.',
                              );
                              setSelectedLocation({ lat, lng, city, address });
                            }
                          }}
                        >
                          <Input
                            placeholder="Search for your address (Johannesburg or Pretoria only)"
                            className="w-full"
                            value={selectedLocation.address}
                            onChange={(e) =>
                              setSelectedLocation({
                                ...selectedLocation,
                                address: e.target.value,
                              })
                            }
                          />
                        </Autocomplete>
                      ) : (
                        <Input placeholder="Loading Google Maps..." disabled />
                      )}
                      {locationError && (
                        <div className="text-red-600 mt-2 font-medium">
                          {locationError}
                        </div>
                      )}
                    </div>
                  </div>
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
                <div className="border rounded-lg p-4 bg-white">
                  <h3 className="font-semibold mb-2">Booking Summary</h3>
                  <div className="text-sm text-slate-700">
                    <div>
                      Category: <b>{category?.name}</b>
                    </div>
                    <div>
                      Service: <b>{selectedService?.name}</b>
                    </div>
                    {category?.name === 'Home Cleaning' && propertySize && (
                      <div>
                        Property Size: <b>{propertySize}</b>
                      </div>
                    )}
                    {category?.name === 'Painting' && wallArea && (
                      <div>
                        Wall Area: <b>{wallArea} m²</b>
                      </div>
                    )}
                    {category?.name === 'Pool Cleaning' && poolSize && (
                      <div>
                        Pool Size: <b>{poolSize}</b>
                      </div>
                    )}
                    {category?.name === 'Fumigation (Pest Control)' && (
                      <>
                        {pestType && (
                          <div>
                            Pest Type: <b>{pestType}</b>
                          </div>
                        )}
                        {propertySize && (
                          <div>
                            Property Size: <b>{propertySize}</b>
                          </div>
                        )}
                        <div>
                          Emergency: <b>{emergencyType}</b>
                        </div>
                      </>
                    )}
                    {category?.name === 'Rubble Removal' && loadSize && (
                      <div>
                        Load Size: <b>{loadSize}</b>
                      </div>
                    )}
                    {category?.name === 'Locksmith' && locksmithType && (
                      <>
                        <div>
                          Locksmith Type: <b>{locksmithType}</b>
                        </div>
                        {locksmithSubType && (
                          <div>
                            Service: <b>{locksmithSubType}</b>
                          </div>
                        )}
                      </>
                    )}
                    {category?.name === 'Moving / Removals' && (
                      <>
                        {truckSize && (
                          <div>
                            Truck Size: <b>{truckSize}</b>
                          </div>
                        )}
                        {moveDistance && (
                          <div>
                            Distance: <b>{moveDistance}</b>
                          </div>
                        )}
                        {specialItem && (
                          <div>
                            Special Item: <b>{specialItem}</b>
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      Date: <b>{selectedDate}</b>
                    </div>
                    <div>
                      Time: <b>{selectedTime}</b>
                    </div>
                    <div>
                      Location:{' '}
                      <b>
                        {selectedLocation.address}
                        {selectedLocation.city && `, ${selectedLocation.city}`}
                      </b>
                    </div>
                    <div>
                      Total Price: <b>R{totalPrice}</b>
                    </div>
                    <div>
                      Total Duration: <b>{totalDuration} min</b>
                    </div>
                  </div>
                </div>

                {/* Worker Availability Check */}
                {checkingWorker && (
                  <div className="text-blue-600">
                    Checking worker availability...
                  </div>
                )}
                {workerError && (
                  <div className="text-red-600 font-medium">{workerError}</div>
                )}

                {/* Payment Section */}
                <div>
                  <div className="font-semibold mb-2">Payment</div>
                  <div className="text-slate-600 mb-2">
                    Payment integration coming soon!
                  </div>
                  <button
                    className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={!workerAvailable || checkingWorker}
                    onClick={() => alert('Payment integration coming soon!')}
                  >
                    Complete Booking
                  </button>
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
            onClick={async () => {
              if (currentStep === 1 && selectedServiceId) {
                setCurrentStep(2);
              } else if (currentStep === 2) {
                setCurrentStep(3);
              } else if (
                currentStep === 3 &&
                selectedLocation.city &&
                !locationError &&
                selectedDate &&
                selectedTime
              ) {
                // Static worker availability check before Step 4
                setCheckingWorker(true);
                setWorkerError('');
                // Simulate API call delay
                setTimeout(() => {
                  // Simple static logic: block booking if time is 17:00 (simulate no worker available)
                  if (selectedTime === '17:00') {
                    setWorkerAvailable(false);
                    setWorkerError(
                      'No worker available for this slot. Please choose another time.',
                    );
                  } else {
                    setWorkerAvailable(true);
                    setWorkerError('');
                    setCurrentStep(4);
                  }
                  setCheckingWorker(false);
                }, 1000);
              } else if (currentStep === 4) {
                // Handle payment/booking creation
                alert('Payment integration coming soon!');
              }
            }}
            disabled={
              (currentStep === 1 && !selectedServiceId) ||
              (currentStep === 2 &&
                ((category?.name === 'Home Cleaning' && !propertySize) ||
                  (category?.name === 'Painting' && !wallArea) ||
                  (category?.name === 'Pool Cleaning' && !poolSize) ||
                  (category?.name === 'Fumigation (Pest Control)' &&
                    (!pestType || !propertySize)) ||
                  (category?.name === 'Rubble Removal' && !loadSize) ||
                  (category?.name === 'Locksmith' &&
                    (!locksmithType || !locksmithSubType)) ||
                  (category?.name === 'Moving / Removals' &&
                    (!truckSize || !moveDistance)))) ||
              (currentStep === 3 &&
                (!selectedLocation.city ||
                  !!locationError ||
                  !selectedDate ||
                  !selectedTime)) ||
              (currentStep === 4 && (!workerAvailable || checkingWorker))
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
