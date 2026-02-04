'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useGetServices,
  useGetCategories,
  useGetServiceOptions,
  useDeleteService,
  useDeleteServiceOption,
} from '@/lib/client/api';
import type { ServiceOption } from '@/lib/client/api/services';
import { useDeleteServiceCategory } from '@/lib/client/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ServiceEditModal,
  ServiceOptionEditModal,
  ServiceCategoryEditModal,
} from '@/components/pages/admin/serviceForms';
import {
  EmptyState,
  SectionHeader,
  ActionDropdown,
  DeleteConfirmationDialog,
} from '@/components/common';

export default function ServicesPage() {
  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategories();
  const { data: servicesData, isLoading: servicesLoading } = useGetServices();
  const deleteCategoryMutation = useDeleteServiceCategory();
  const deleteServiceMutation = useDeleteService();
  const deleteOptionMutation = useDeleteServiceOption();

  const categories = useMemo(
    () => categoriesData?.categories || [],
    [categoriesData],
  );
  const services = useMemo(() => servicesData || [], [servicesData]);

  // Auto-select first category, but allow manual override
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [editingCategory, setEditingCategory] = useState<
    (typeof categories)[0] | null
  >(null);
  const [deleteCategory, setDeleteCategory] = useState<
    (typeof categories)[0] | null
  >(null);
  const [editingService, setEditingService] = useState<
    (typeof services)[0] | null
  >(null);
  const [deleteService, setDeleteService] = useState<
    (typeof services)[0] | null
  >(null);
  const [editingOption, setEditingOption] = useState<ServiceOption | null>(
    null,
  );
  const [deleteOption, setDeleteOption] = useState<ServiceOption | null>(null);

  // Derive the active category ID (manual selection or first category)
  const activeCategoryId = useMemo(() => {
    if (selectedCategoryId) return selectedCategoryId;
    return categories.length > 0 ? categories[0].id : null;
  }, [selectedCategoryId, categories]);

  // Filter services for active category
  const filteredServices = useMemo(() => {
    if (!activeCategoryId) return [];
    return services.filter((s) => s.category_id === activeCategoryId);
  }, [services, activeCategoryId]);

  // Derive the active service ID (manual selection or first service)
  const activeServiceId = useMemo(() => {
    if (
      selectedServiceId &&
      filteredServices.some((s) => s.id === selectedServiceId)
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
      ? filteredServices.find((s) => s.id === activeServiceId)
      : null;
  }, [activeServiceId, filteredServices]);

  const selectedCategory = useMemo(() => {
    return activeCategoryId
      ? categories.find((c) => c.id === activeCategoryId)
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
        <SectionHeader
          title="Categories"
          description="Select a category to view its services"
          action={
            <Link href="/admin/services/new">
              <Button>+ Create New Category</Button>
            </Link>
          }
        />

        {/* Category Cards */}
        {categories.length === 0 ? (
          <EmptyState
            message="No categories yet. Create your first service category to get started."
            action={
              <Link href="/admin/services/new">
                <Button>Create First Category</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`relative rounded-lg p-4 cursor-pointer transition-all duration-200 text-center flex flex-col items-center border-2 ${
                  activeCategoryId === category.id
                    ? 'border-black shadow-md border-2'
                    : 'hover:shadow-sm'
                }`}
              >
                <ActionDropdown
                  onEdit={() => setEditingCategory(category)}
                  onDelete={() => setDeleteCategory(category)}
                />
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
          <SectionHeader
            title="Services"
            description={
              selectedCategory?.name
                ? `Services in ${selectedCategory.name}`
                : undefined
            }
            action={
              <Link href="/admin/services/new">
                <Button>+ Create New Service</Button>
              </Link>
            }
          />

          {filteredServices.length === 0 ? (
            <EmptyState
              message="No services in this category yet"
              action={
                <Link href="/admin/services/new">
                  <Button>Create First Service</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`relative rounded-lg p-4 cursor-pointer border-2 transition-all duration-200 ${
                    activeServiceId === service.id
                      ? 'border-black shadow-md'
                      : 'hover:shadow-sm'
                  }`}
                >
                  <ActionDropdown
                    onEdit={() => setEditingService(service)}
                    onDelete={() => setDeleteService(service)}
                  />
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
          <SectionHeader
            title="Service Options"
            description={
              selectedService?.name
                ? `Options for ${selectedService.name}`
                : undefined
            }
            action={
              <Link href="/admin/services/new">
                <Button>+ Create New Option</Button>
              </Link>
            }
          />

          {optionsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : options.length === 0 ? (
            <EmptyState
              message="No options added yet"
              action={
                <Link href="/admin/services/new">
                  <Button>Add First Option</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {options.map((option) => (
                <div
                  key={option.id}
                  className="relative rounded-lg p-4 border-2  hover:shadow-sm transition-all duration-200"
                >
                  <ActionDropdown
                    onEdit={() => setEditingOption(option)}
                    onDelete={() => setDeleteOption(option)}
                    stopPropagation={false}
                  />
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

                    <div className="flex items-center justify-between text-xs text-gray-400 pr-8">
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

      <ServiceCategoryEditModal
        open={!!editingCategory}
        category={editingCategory}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null);
        }}
        onSuccess={() => setEditingCategory(null)}
      />

      <ServiceEditModal
        open={!!editingService}
        service={editingService}
        onOpenChange={(open) => {
          if (!open) setEditingService(null);
        }}
        onSuccess={() => setEditingService(null)}
      />

      <ServiceOptionEditModal
        open={!!editingOption}
        option={editingOption}
        onOpenChange={(open) => {
          if (!open) setEditingOption(null);
        }}
        onSuccess={() => setEditingOption(null)}
      />

      <DeleteConfirmationDialog
        open={!!deleteCategory}
        onOpenChange={(open) => {
          if (!open) setDeleteCategory(null);
        }}
        title="Delete Category"
        itemName={deleteCategory?.name}
        description="Deleting this category will also delete all linked services and service options. Are you sure you want to delete"
        onConfirm={() => {
          if (!deleteCategory) return;
          deleteCategoryMutation.mutate(deleteCategory.id, {
            onSuccess: () => {
              setDeleteCategory(null);
              toast.success('Category deleted successfully');
            },
            onError: (error) => {
              toast.error(error.message || 'Failed to delete category');
            },
          });
        }}
        isDeleting={deleteCategoryMutation.isPending}
      />

      <DeleteConfirmationDialog
        open={!!deleteService}
        onOpenChange={(open) => {
          if (!open) setDeleteService(null);
        }}
        title="Delete Service"
        itemName={deleteService?.name}
        description="Deleting this service will also delete all linked service options. Are you sure you want to delete"
        onConfirm={() => {
          if (!deleteService) return;
          deleteServiceMutation.mutate(deleteService.id, {
            onSuccess: () => {
              setDeleteService(null);
              toast.success('Service deleted successfully');
            },
            onError: (error) => {
              toast.error(error.message || 'Failed to delete service');
            },
          });
        }}
        isDeleting={deleteServiceMutation.isPending}
      />

      <DeleteConfirmationDialog
        open={!!deleteOption}
        onOpenChange={(open) => {
          if (!open) setDeleteOption(null);
        }}
        title="Delete Option"
        itemName={deleteOption?.name}
        onConfirm={() => {
          if (!deleteOption) return;
          deleteOptionMutation.mutate(
            { serviceId: deleteOption.service_id, optionId: deleteOption.id },
            {
              onSuccess: () => {
                setDeleteOption(null);
                toast.success('Option deleted successfully');
              },
              onError: (error) => {
                toast.error(error.message || 'Failed to delete option');
              },
            },
          );
        }}
        isDeleting={deleteOptionMutation.isPending}
      />
    </div>
  );
}
