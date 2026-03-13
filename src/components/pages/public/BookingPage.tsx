'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddOptionsStep from './Booking/AddOptionsStep';
import AddDetailsStep from './Booking/AddDetailsStep';
import AddressDateStep from './Booking/AddressDateStep';
import AddRequirementsStep from './Booking/AddRequirementsStep';
import ReviewPaymentStep from './Booking/ReviewPaymentStep';
import { Form } from '@/components/ui/form';
import { Button, Input, Label } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';

import type { Service, ServiceOptionItem } from '@/lib/types';
import type { ServiceRequirement } from '@/lib/types/admin/services/variant';
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
  const [selectedRequirements, setSelectedRequirements] = useState<
    Record<string, string>
  >({});
  const [additionalDetails, setAdditionalDetails] = useState<{ notes: string }>(
    { notes: '' },
  );
  const [addressDateData, setAddressDateData] = useState<{
    address: string;
    unit_or_flat: string;
    date: string;
    time: string;
  }>({ address: '', unit_or_flat: '', date: '', time: '' });

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
  const {
    data: optionsData = [],
    isLoading: optionsLoading,
    isFetching: optionsFetching,
  } = useQuery({
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

  // Fetch requirements for selected service
  const {
    data: requirementsData = [],
    isLoading: requirementsLoading,
    isFetching: requirementsFetching,
  } = useQuery({
    queryKey: ['service-requirements', serviceData?.id],
    queryFn: async (): Promise<ServiceRequirement[]> => {
      if (!serviceData?.id) return [];
      const response = await fetch(
        `/api/services/requirements?service_id=${serviceData.id}`,
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data?.requirements || [];
    },
    enabled: !!serviceData?.id,
  });

  const hasOptions = optionsData.length > 0;
  const hasRequirementsStep = requirementsData.length > 0;
  const isServiceConfigurationLoading =
    !!selectedServiceSlug &&
    (serviceLoading ||
      optionsLoading ||
      requirementsLoading ||
      optionsFetching ||
      requirementsFetching);

  const stepMap = useMemo(() => {
    let stepNo = 1;
    const map = {
      selectService: isCategoryFlow ? stepNo++ : null,
      requirements: hasRequirementsStep ? stepNo++ : null,
      options: hasOptions ? stepNo++ : null,
      additionalDetails: stepNo++,
      address: stepNo++,
      review: stepNo++,
    };

    return map;
  }, [isCategoryFlow, hasRequirementsStep, hasOptions]);

  const selectedOptionsArray = optionsData.filter(
    (opt) => selectedOptions[opt.id],
  );

  const selectedRequirementsArray = Object.values(selectedRequirements)
    .map((requirementId) =>
      requirementsData.find((requirement) => requirement.id === requirementId),
    )
    .filter(Boolean) as ServiceRequirement[];

  const totalDurationMinutes =
    (serviceData?.duration_minutes || 0) +
    selectedOptionsArray.reduce(
      (sum, option) => sum + (option.duration_minutes || 0),
      0,
    ) +
    selectedRequirementsArray.reduce(
      (sum, requirement) => sum + (requirement.duration_minutes || 0),
      0,
    );

  // Calculate dynamic steps based on category flow + options + requirements
  const steps = useMemo(() => {
    const baseSteps: Array<{
      id: number;
      name: string;
      shortName: string;
      description?: string;
    }> = [];

    if (stepMap.selectService) {
      baseSteps.push({
        id: stepMap.selectService,
        name: 'Choose Service',
        shortName: 'Service',
        description: 'Choose one service from this category to continue.',
      });
    }
    if (stepMap.requirements) {
      baseSteps.push({
        id: stepMap.requirements,
        name: 'Service Details',
        shortName: 'Details',
        description: 'Please choose the details that best match your booking.',
      });
    }
    if (stepMap.options) {
      baseSteps.push({
        id: stepMap.options,
        name: 'Additional Services',
        shortName: 'Additional',
        description:
          'Select any additional services you would like to include.',
      });
    }
    baseSteps.push({
      id: stepMap.additionalDetails,
      name: 'Notes',
      shortName: 'Notes',
      description:
        'Add any additional details or instructions for your booking.',
    });
    baseSteps.push({
      id: stepMap.address,
      name: 'Address, Date & Time',
      shortName: 'Schedule',
      description:
        'Provide the address and select a date and time for the booking.',
    });
    baseSteps.push({
      id: stepMap.review,
      name: 'Review & Pay',
      shortName: 'Review',
      description: 'Review your booking details and proceed to payment.',
    });

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

  if (categoryLoading) return <Loading />;

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

  if (serviceLoading && !isCategoryFlow) return <Loading />;

  return (
    <div className="py-10 md:py-16 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-8">
        {/* Sidebar: Category and Service Details */}
        <div className="max-w-6xl w-full grid grid-cols-12 gap-6 lg:gap-8">
          <div className="col-span-12 lg:col-span-4 bg-white border rounded-xl shadow p-4 sm:p-6 flex flex-col gap-6">
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
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {steps.find((step) => step.id === currentStep)?.name ||
                        'Booking'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {steps.find((step) => step.id === currentStep)
                        ?.description ||
                        'Please follow the steps to complete your booking.'}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 shrink-0">
                    {Math.max(
                      1,
                      steps.findIndex((step) => step.id === currentStep) + 1,
                    )}{' '}
                    / {steps.length}
                  </p>
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-black transition-all"
                    style={{
                      width: `${
                        (Math.max(
                          1,
                          steps.findIndex((step) => step.id === currentStep) +
                            1,
                        ) /
                          steps.length) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {steps.map((step) => (
                    <span
                      key={step.id}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        currentStep === step.id
                          ? 'bg-black text-white'
                          : currentStep > step.id
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {step.shortName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Form>
              {stepMap.selectService &&
                currentStep === stepMap.selectService && (
                  <div className="border bg-white rounded-lg p-4">
                    <div className="mb-2">
                      <Label className="block font-semibold mb-3 text-base">
                        Services
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {categoryServices.map((service) => {
                        const isSelected = selectedServiceSlug === service.slug;
                        return (
                          <div
                            key={service.id}
                            onClick={() => {
                              setSelectedServiceSlug(service.slug);
                              setSelectedOptions({});
                              setSelectedRequirements({});
                              setAdditionalDetails({ notes: '' });
                              setAddressDateData({
                                address: '',
                                unit_or_flat: '',
                                date: '',
                                time: '',
                              });
                            }}
                            className={`flex items-start gap-3 rounded-lg border p-3 sm:p-4 cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-black bg-green-50'
                                : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <Input
                              type="radio"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedServiceSlug(service.slug);
                                setSelectedOptions({});
                                setSelectedRequirements({});
                                setAdditionalDetails({ notes: '' });
                                setAddressDateData({
                                  address: '',
                                  unit_or_flat: '',
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

                    <div className="mt-8 flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">
                        {isServiceConfigurationLoading
                          ? 'Loading service details...'
                          : 'Select a service and continue'}
                      </p>
                      <Button
                        type="button"
                        onClick={() => {
                          if (
                            !selectedServiceSlug ||
                            isServiceConfigurationLoading
                          )
                            return;
                          setCurrentStep(
                            stepMap.requirements ||
                              stepMap.options ||
                              stepMap.additionalDetails ||
                              stepMap.address,
                          );
                        }}
                        disabled={
                          !selectedServiceSlug || isServiceConfigurationLoading
                        }
                      >
                        {isServiceConfigurationLoading
                          ? 'Please wait...'
                          : 'Next'}
                      </Button>
                    </div>
                  </div>
                )}

              {stepMap.options && currentStep === stepMap.options && (
                <>
                  {optionsLoading || optionsFetching ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                      <p className="text-sm font-medium text-slate-700">
                        Loading additional services...
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="h-12 w-full animate-pulse rounded-md bg-slate-100" />
                        <div className="h-12 w-full animate-pulse rounded-md bg-slate-100" />
                        <div className="h-12 w-full animate-pulse rounded-md bg-slate-100" />
                      </div>
                    </div>
                  ) : (
                    <AddOptionsStep
                      optionsData={optionsData}
                      selectedOptions={selectedOptions}
                      setSelectedOptions={setSelectedOptions}
                      onNext={() => setCurrentStep(stepMap.additionalDetails)}
                      onBack={
                        stepMap.requirements
                          ? () => {
                              setCurrentStep(stepMap.requirements as number);
                            }
                          : stepMap.selectService
                            ? () => {
                                setCurrentStep(stepMap.selectService as number);
                              }
                            : undefined
                      }
                    />
                  )}
                </>
              )}

              {serviceData &&
                stepMap.requirements &&
                currentStep === stepMap.requirements && (
                  <>
                    {requirementsLoading || requirementsFetching ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <p className="text-sm font-medium text-slate-700">
                          Loading service details...
                        </p>
                        <div className="mt-4 space-y-3">
                          <div className="h-12 w-full animate-pulse rounded-md bg-slate-100" />
                          <div className="h-12 w-full animate-pulse rounded-md bg-slate-100" />
                          <div className="h-12 w-full animate-pulse rounded-md bg-slate-100" />
                        </div>
                      </div>
                    ) : (
                      <AddRequirementsStep
                        requirements={requirementsData}
                        selectedRequirements={selectedRequirements}
                        setSelectedRequirements={setSelectedRequirements}
                        onNext={() =>
                          setCurrentStep(
                            stepMap.options || stepMap.additionalDetails,
                          )
                        }
                        onBack={() =>
                          setCurrentStep(stepMap.selectService || 1)
                        }
                      />
                    )}
                  </>
                )}

              {currentStep === stepMap.additionalDetails && (
                <AddDetailsStep
                  details={additionalDetails}
                  setDetails={setAdditionalDetails}
                  onNext={() => setCurrentStep(stepMap.address)}
                  onBack={() =>
                    setCurrentStep(
                      stepMap.options ||
                        stepMap.requirements ||
                        stepMap.selectService ||
                        1,
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
                      stepMap.additionalDetails ||
                        stepMap.options ||
                        stepMap.requirements ||
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
                  selectedRequirements={selectedRequirements}
                  requirementsData={requirementsData}
                  additionalDetails={additionalDetails}
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
