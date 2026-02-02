'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetServices } from '@/lib/client/api/services/services.query';
import { useGetCategories } from '@/lib/client/api/services/categories.query';
import { useGetServiceOptions } from '@/lib/client/api/services/services.query';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function ServicesPage() {
  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategories();
  const { data: servicesData, isLoading: servicesLoading } = useGetServices();

  const categories = categoriesData?.categories || [];
  const services = servicesData || [];

  // Auto-select first category, but allow manual override
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );

  // Derive the active category ID (manual selection or first category)
  const activeCategoryId = useMemo(() => {
    if (selectedCategoryId) return selectedCategoryId;
    return categories.length > 0 ? categories[0].id : null;
  }, [selectedCategoryId, categories]);

  // Filter services for active category
  const filteredServices = useMemo(() => {
    if (!activeCategoryId) return [];
    return services.filter((s: any) => s.category_id === activeCategoryId);
  }, [services, activeCategoryId]);

  // Derive the active service ID (manual selection or first service)
  const activeServiceId = useMemo(() => {
    if (
      selectedServiceId &&
      filteredServices.some((s: any) => s.id === selectedServiceId)
    ) {
      return selectedServiceId;
    }
    return filteredServices.length > 0 ? filteredServices[0].id : null;
  }, [selectedServiceId, filteredServices]);

  const { data: optionsData, isLoading: optionsLoading } = useGetServiceOptions(
    activeServiceId || '',
  );

  const selectedService = useMemo(() => {
    return activeServiceId
      ? filteredServices.find((s: any) => s.id === activeServiceId)
      : null;
  }, [activeServiceId, filteredServices]);

  const selectedCategory = useMemo(() => {
    return activeCategoryId
      ? categories.find((c: any) => c.id === activeCategoryId)
      : null;
  }, [activeCategoryId, categories]);

  const options = optionsData || [];

  if (categoriesLoading || servicesLoading) {
    return (
      <div className="py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-gray-600">Manage your service offerings</p>
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="py-10 space-y-8">
      {/* CATEGORIES SECTION */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a category to view its services
            </p>
          </div>
          <Link href="/admin/services/new">
            <Button>+ Create New Category</Button>
          </Link>
        </div>

        {/* Category Cards */}
        {categories.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  No categories yet. Create your first service category to get
                  started.
                </p>
                <Link href="/admin/services/new">
                  <Button>Create First Category</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category: any) => (
              <div
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`rounded-lg p-4 cursor-pointer transition-all duration-200 text-center flex flex-col items-center border-2 ${
                  activeCategoryId === category.id
                    ? 'border-black shadow-md border-2'
                    : 'hover:shadow-sm'
                }`}
              >
                {category.image_url && (
                  <div className="mb-3">
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      className="w-44 object-cover rounded-md"
                      width={400}
                      height={400}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900">
                    {category.name}
                  </p>
                  {category.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    Display Order: {category.display_order || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SERVICES SECTION */}
      {activeCategoryId && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Services</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedCategory?.name &&
                  `Services in ${selectedCategory.name}`}
              </p>
            </div>
            <Link href="/admin/services/new">
              <Button>+ Create New Service</Button>
            </Link>
          </div>

          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No services in this category yet
                  </p>
                  <Link href="/admin/services/new">
                    <Button>Create First Service</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service: any) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`rounded-lg p-4 cursor-pointer border-2 transition-all duration-200 ${
                    activeServiceId === service.id
                      ? 'border-black shadow-md'
                      : 'hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <p className="text-lg font-bold text-gray-900">
                      {service.name}
                    </p>
                    {service.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                        R{service.base_price.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {service.duration_minutes} min
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          service.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Display Order: {service.display_order || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OPTIONS SECTION */}
      {selectedService && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Service Options
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedService?.name && `Options for ${selectedService.name}`}
              </p>
            </div>
            <Link href={`/admin/services/new`}>
              <Button>+ Create New Option</Button>
            </Link>
          </div>

          {optionsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : options.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No options added yet</p>
                  <Link href={`/admin/services/new`}>
                    <Button>Add First Option</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {options.map((option: any) => (
                <div
                  key={option.id}
                  className="rounded-lg p-4 border-2  hover:shadow-sm transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-lg font-bold text-gray-900">
                        {option.name}
                      </p>
                      {option.is_required && (
                        <span className="px-2 py-1 bg-green-700 text-white text-xs font-semibold rounded-full whitespace-nowrap">
                          Required
                        </span>
                      )}
                    </div>

                    {option.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {option.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                        R{option.price.toFixed(2)}
                      </span>
                      {option.duration_minutes && (
                        <span className="text-xs text-gray-500">
                          {option.duration_minutes} min
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          option.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {option.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Order: {option.display_order || 0}</span>
                      <span>
                        {new Date(option.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
