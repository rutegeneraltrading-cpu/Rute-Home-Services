'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddOptionsStep from './Booking/AddOptionsStep';
import AddressDateStep from './Booking/AddressDateStep';
import AddVariantsStep from './Booking/AddVariantsStep';
import ReviewPaymentStep from './Booking/ReviewPaymentStep';
import { Form } from '@/components/ui/form';
import { Button, Input, Label } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';

import type { Service, ServiceOptionItem } from '@/lib/types';
import type { ServiceOptionVariant } from '@/lib/types/admin/services/variant';
import { Loading } from '@/components/common';

const BookingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceSlug = searchParams.get('service');
  const categorySlug = searchParams.get('category');
  const isCategoryFlow = Boolean(categorySlug);

  const [selectedServiceSlug, setSelectedServiceSlug] = useState<string | null>(
    serviceSlug || null,
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, boolean>
  >({});
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [addressDateData, setAddressDateData] = useState<{
    address: string;
    date: string;
    time: string;
  }>({ address: '', date: '', time: '' });

  const {
    data: categoryServices = [],
    isLoading: categoryServicesLoading,
    isFetched: categoryServicesFetched,
  } = useQuery({
    queryKey: ['public-services-by-category', categorySlug],
    queryFn: async (): Promise<Service[]> => {
      if (!categorySlug) return [];

      const response = await fetch('/api/services');
      if (!response.ok) return [];
      const payload = await response.json();
      const services = Array.isArray(payload?.services) ? payload.services : [];

      return services.filter(
        (service: Service & { category?: { slug?: string } }) =>
          service?.category?.slug === categorySlug,
      );
    },
    enabled: !!categorySlug,
  });

  const { data: categoryMeta } = useQuery({
    queryKey: ['public-category-meta', categorySlug],
    queryFn: async (): Promise<{
      id: string;
      name: string;
      slug: string;
      description?: string;
      charge_type?: string;
    } | null> => {
      if (!categorySlug) return null;

      const response = await fetch('/api/services/categories');
      if (!response.ok) return null;
      const payload = await response.json();
      const categories = Array.isArray(payload?.categories)
        ? payload.categories
        : [];

      return categories.find(
        (cat: { slug?: string }) => cat.slug === categorySlug,
      );
    },
    enabled: !!categorySlug,
  });

  const { data: serviceData, isLoading: serviceLoading } = useQuery({
    queryKey: ['public-service-by-slug', selectedServiceSlug],
    queryFn: async (): Promise<Service | null> => {
      if (!selectedServiceSlug) return null;
      const response = await fetch(`/api/services/slug/${selectedServiceSlug}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data?.service || null;
    },
    enabled: !!selectedServiceSlug,
  });

  // Use category info directly from serviceData.category
  const categoryData = serviceData?.category || categoryMeta;
  const categoryLoading = categoryServicesLoading;

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

  // Get selected option IDs
  const selectedOptionIds = Object.keys(selectedOptions).filter(
    (key) => selectedOptions[key],
  );

  // Fetch variants for selected options
  const { data: variantsData = [] } = useQuery({
    queryKey: ['service-option-variants', selectedOptionIds.join(',')],
    queryFn: async (): Promise<ServiceOptionVariant[]> => {
      if (selectedOptionIds.length === 0) return [];
      const response = await fetch(
        `/api/services/options/variants?option_ids=${selectedOptionIds.join(',')}`,
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data?.variants || [];
    },
    enabled: selectedOptionIds.length > 0,
  });

  const hasOptions = optionsData.length > 0;
  const hasVariantStep = hasOptions && variantsData.length > 0;

  const stepMap = useMemo(() => {
    let stepNo = 1;
    const map = {
      selectService: isCategoryFlow ? stepNo++ : null,
      options: hasOptions ? stepNo++ : null,
      variants: hasVariantStep ? stepNo++ : null,
      address: stepNo++,
      review: stepNo++,
    };

    return map;
  }, [isCategoryFlow, hasOptions, hasVariantStep]);

  const selectedOptionsArray = optionsData.filter(
    (opt) => selectedOptions[opt.id],
  );

  const selectedVariantsArray = Object.values(selectedVariants)
    .map((variantId) =>
      variantsData.find((variant) => variant.id === variantId),
    )
    .filter(Boolean) as ServiceOptionVariant[];

  const totalDurationMinutes =
    (serviceData?.duration_minutes || 0) +
    selectedOptionsArray.reduce(
      (sum, option) => sum + (option.duration_minutes || 0),
      0,
    ) +
    selectedVariantsArray.reduce(
      (sum, variant) => sum + (variant.duration_minutes || 0),
      0,
    );

  // Calculate dynamic steps based on category flow + options + variants
  const steps = useMemo(() => {
    const baseSteps: Array<{ id: number; name: string }> = [];

    if (stepMap.selectService) {
      baseSteps.push({ id: stepMap.selectService, name: 'Select Service' });
    }
    if (stepMap.options) {
      baseSteps.push({ id: stepMap.options, name: 'Add Options' });
    }
    if (stepMap.variants) {
      baseSteps.push({ id: stepMap.variants, name: 'Select Variants' });
    }

    baseSteps.push({ id: stepMap.address, name: 'Address & Date' });
    baseSteps.push({ id: stepMap.review, name: 'Review & Pay' });

    return baseSteps;
  }, [stepMap]);

  // Calculate the final step number
  const finalStepNumber = steps[steps.length - 1].id;

  const shouldShowNotFound =
    (!serviceSlug && !categorySlug) ||
    (!!categorySlug &&
      categoryServicesFetched &&
      categoryServices.length === 0 &&
      !selectedServiceSlug) ||
    (!!selectedServiceSlug && !serviceLoading && !serviceData) ||
    (!categoryLoading && !categoryData);

  if (categoryLoading) return <Loading fullScreen />;

  if (shouldShowNotFound) {
    return (
      <div className="py-16 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8 text-center space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">
              Data not found
            </h1>
            <p className="text-slate-600">
              We could not find booking data for the selected service/category.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button onClick={() => router.push('/services')}>
                Go to Services
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const resolvedCategoryData = categoryData as NonNullable<typeof categoryData>;

  if (serviceLoading) return <Loading fullScreen />;

  return (
    <div className="py-16 bg-slate-50 min-h-screen">
      <div className="container mx-auto flex items-center justify-center gap-8">
        {/* Sidebar: Category and Service Details */}
        <div className="max-w-5xl grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold mb-2">Category</h2>
              <div className="text-slate-800 font-semibold">
                {resolvedCategoryData?.name}
              </div>
              {resolvedCategoryData?.description && (
                <div className="text-slate-500 text-sm mt-1">
                  {resolvedCategoryData.description}
                </div>
              )}
            </div>
            {serviceData && (
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
                    {resolvedCategoryData?.charge_type} -{' '}
                  </span>
                  {serviceData.base_price}
                  <span className="text-sm">ZAR</span>
                </div>
              </div>
            )}
          </div>
          {/* Stepper Form */}
          <main className="col-span-12 lg:col-span-8">
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
              {stepMap.selectService &&
                currentStep === stepMap.selectService && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Select Service</h2>
                    <p className="text-slate-600 mb-6 text-sm">
                      Choose one service from this category to continue.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryServices.map((service) => {
                        const isSelected = selectedServiceSlug === service.slug;
                        return (
                          <div
                            key={service.id}
                            onClick={() => {
                              setSelectedServiceSlug(service.slug);
                              setSelectedOptions({});
                              setSelectedVariants({});
                              setAddressDateData({
                                address: '',
                                date: '',
                                time: '',
                              });
                            }}
                            className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-black bg-slate-50'
                                : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <Input
                              type="radio"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedServiceSlug(service.slug);
                                setSelectedOptions({});
                                setSelectedVariants({});
                                setAddressDateData({
                                  address: '',
                                  date: '',
                                  time: '',
                                });
                              }}
                              className="accent-black w-4 h-4 mt-1"
                            />
                            <Label className="flex-1 cursor-pointer">
                              <span className="font-semibold text-slate-900 block">
                                {service.name}
                              </span>
                              {service.description && (
                                <span className="text-sm text-slate-600 mt-1 line-clamp-2 block">
                                  {service.description}
                                </span>
                              )}
                              <span className="mt-2 text-green-700 font-semibold text-sm block">
                                R{Number(service.base_price || 0).toFixed(2)}
                              </span>
                            </Label>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end mt-8">
                      <Button
                        type="button"
                        onClick={() => {
                          if (!selectedServiceSlug) return;
                          setCurrentStep(stepMap.options || stepMap.address);
                        }}
                        disabled={!selectedServiceSlug}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}

              {stepMap.options && currentStep === stepMap.options && (
                <AddOptionsStep
                  optionsData={optionsData}
                  selectedOptions={selectedOptions}
                  setSelectedOptions={setSelectedOptions}
                  onNext={() =>
                    setCurrentStep(stepMap.variants || stepMap.address)
                  }
                  onBack={
                    stepMap.selectService
                      ? () => {
                          setCurrentStep(stepMap.selectService as number);
                        }
                      : undefined
                  }
                />
              )}

              {serviceData &&
                stepMap.variants &&
                currentStep === stepMap.variants && (
                  <AddVariantsStep
                    variants={variantsData}
                    selectedVariants={selectedVariants}
                    setSelectedVariants={setSelectedVariants}
                    onNext={() => setCurrentStep(stepMap.address)}
                    onBack={() =>
                      setCurrentStep(
                        stepMap.options || stepMap.selectService || 1,
                      )
                    }
                  />
                )}

              {serviceData && currentStep === stepMap.address && (
                <AddressDateStep
                  serviceId={serviceData.id}
                  totalDurationMinutes={totalDurationMinutes}
                  addressDateData={addressDateData}
                  setAddressDateData={setAddressDateData}
                  onNext={() => setCurrentStep(stepMap.review)}
                  onBack={() =>
                    setCurrentStep(
                      stepMap.variants ||
                        stepMap.options ||
                        stepMap.selectService ||
                        stepMap.address,
                    )
                  }
                />
              )}

              {serviceData && currentStep === finalStepNumber && (
                <ReviewPaymentStep
                  serviceData={serviceData}
                  categoryData={resolvedCategoryData}
                  optionsData={optionsData}
                  selectedOptions={selectedOptions}
                  selectedVariants={selectedVariants}
                  variantsData={variantsData}
                  addressDateData={addressDateData}
                  onBack={() => {
                    // Go back to address step
                    setCurrentStep(stepMap.address);
                  }}
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
