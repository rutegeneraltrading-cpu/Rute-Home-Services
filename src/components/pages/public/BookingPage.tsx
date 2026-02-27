'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AddOptionsStep from './Booking/AddOptionsStep';
import AddressDateStep from './Booking/AddressDateStep';
import ReviewPaymentStep from './Booking/ReviewPaymentStep';
import { Form } from '@/components/ui/form';
import { useQuery } from '@tanstack/react-query';

import type { Service, ServiceOptionItem } from '@/lib/types';
import { Loading } from '@/components/common';

const steps = [
  { id: 1, name: 'Add Options' },
  { id: 2, name: 'Address & Date' },
  { id: 3, name: 'Review & Pay' },
];

const BookingPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceSlug = searchParams.get('service');

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, boolean>
  >({});
  const [addressDateData, setAddressDateData] = useState<{
    address: string;
    date: string;
    time: string;
  }>({ address: '', date: '', time: '' });

  const { data: serviceData, isLoading: serviceLoading } = useQuery({
    queryKey: ['public-service-by-slug', serviceSlug],
    queryFn: async (): Promise<Service | null> => {
      if (!serviceSlug) return null;
      const response = await fetch(`/api/services/slug/${serviceSlug}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data?.service || null;
    },
    enabled: !!serviceSlug,
  });

  // Use category info directly from serviceData.category
  const categoryData = serviceData?.category;
  const categoryLoading = serviceLoading;

  // Fetch options for the service
  const { data: optionsData = [] } = useQuery({
    queryKey: ['public-service-options', serviceData?.id],
    queryFn: async (): Promise<ServiceOptionItem[]> => {
      if (!serviceData?.id) return [];
      const response = await fetch(`/api/services/${serviceData.id}/options`);
      if (!response.ok) return [];
      const data = await response.json();
      return data?.options || [];
    },
    enabled: !!serviceData?.id,
  });

  if (!serviceSlug) {
    router.push('/services');
    return null;
  }
  if (serviceLoading || categoryLoading) return <Loading fullScreen />;
  if (!serviceData || !categoryData) {
    return (
      <div className="py-12">
        <div className="container mx-auto text-center">
          <p className="text-slate-600">Service not found. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-slate-50 h-screen">
      <div className="container mx-auto flex items-center justify-center gap-8">
        {/* Sidebar: Category and Service Details */}
        <div className="max-w-5xl grid grid-cols-12 gap-8">
          <div className="col-span-4 bg-white rounded-xl shadow p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold mb-2">Category</h2>
              <div className="text-slate-800 font-semibold">
                {categoryData.name}
              </div>
              {categoryData.description && (
                <div className="text-slate-500 text-sm mt-1">
                  {categoryData.description}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2">Service</h2>
              <div className="text-slate-800 font-semibold">
                {serviceData.name}
              </div>
              {serviceData.description && (
                <div className="text-slate-500 text-sm mt-1">
                  {serviceData.description}
                </div>
              )}
              <div className="mt-2 text-green-700 font-bold">
                <span className="capitalize">
                  {categoryData.charge_type} -{' '}
                </span>
                {serviceData.base_price}
                <span className="text-sm">ZAR</span>
              </div>
            </div>
          </div>
          {/* Stepper Form */}
          <main className="col-span-8">
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
                          currentStep === step.id
                            ? 'text-black'
                            : 'text-slate-600'
                        }`}
                      >
                        {step.name}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-1 flex-1 mx-2 transition-all ${
                          currentStep > step.id
                            ? 'bg-green-600'
                            : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Form>
              {currentStep === 1 && (
                <AddOptionsStep
                  optionsData={optionsData}
                  selectedOptions={selectedOptions}
                  setSelectedOptions={setSelectedOptions}
                  onNext={() => setCurrentStep(2)}
                  onBack={undefined}
                />
              )}
              {currentStep === 2 && (
                <AddressDateStep
                  addressDateData={addressDateData}
                  setAddressDateData={setAddressDateData}
                  onNext={() => setCurrentStep(3)}
                  onBack={() => setCurrentStep(1)}
                />
              )}
              {currentStep === 3 && (
                <ReviewPaymentStep
                  serviceData={serviceData}
                  categoryData={categoryData}
                  optionsData={optionsData}
                  selectedOptions={selectedOptions}
                  addressDateData={addressDateData}
                  onBack={() => setCurrentStep(2)}
                />
              )}
            </Form>
          </main>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
