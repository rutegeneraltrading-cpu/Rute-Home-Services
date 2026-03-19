'use client';

import { useState, useMemo } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import {
  useGetServices,
  useGetCategories,
  useDeleteService,
  useDeleteServiceOption,
  useDeleteServiceRequirement,
  useGetServiceRequirements,
  useDeleteServiceCategory,
  useGetAllServiceOptions,
} from '@/lib/client/api';
import type { ServiceOption } from '@/lib/client/api/services';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ServiceEditModal,
  ServiceOptionEditModal,
  ServiceCategoryEditModal,
  ServiceRequirementEditModal,
} from '@/components/pages/admin/serviceForms';
import { DeleteConfirmationDialog, DataTable } from '@/components/common';
import { Button } from '@/components/ui';
import type { TableColumn, TableAction } from '@/lib/types';
import type { ServiceRequirement } from '@/lib/types/admin/services/variant';

type TabKey = 'categories' | 'services' | 'options' | 'requirements';

type RequirementRow = ServiceRequirement & {
  service_name: string;
  category_name: string;
};

type RequirementApiRow = ServiceRequirement & {
  service?: {
    name?: string;
    category?: {
      name?: string;
    };
  };
};

export default function ServicesPage() {
  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategories();
  const { data: servicesData, isLoading: servicesLoading } = useGetServices();
  const deleteCategoryMutation = useDeleteServiceCategory();
  const deleteServiceMutation = useDeleteService();
  const deleteOptionMutation = useDeleteServiceOption();
  const deleteRequirementMutation = useDeleteServiceRequirement();
  const { data: optionsData, isLoading: optionsLoading } =
    useGetAllServiceOptions();

  const categories = useMemo(
    () => categoriesData?.categories || [],
    [categoriesData],
  );
  const services = useMemo(() => servicesData || [], [servicesData]);

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
  const [activeTab, setActiveTab] = useState<TabKey>('categories');

  // Requirements tab logic
  const { data: rawRequirementsData = [], isLoading: requirementsLoading } =
    useGetServiceRequirements();
  const requirementsData = useMemo<RequirementRow[]>(
    () =>
      (rawRequirementsData as RequirementApiRow[]).map((r) => ({
        ...r,
        service_name: r.service?.name || '',
        category_name: r.service?.category?.name || '',
      })),
    [rawRequirementsData],
  );
  const requirementColumns: TableColumn<RequirementRow>[] = [
    {
      id: 'name',
      header: 'Requirement Name',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'service_name',
      header: 'Service',
      accessorKey: 'service_name',
      sortable: true,
    },
    {
      id: 'category_name',
      header: 'Category',
      accessorKey: 'category_name',
      sortable: true,
    },
    { id: 'type', header: 'Type', accessorKey: 'type', sortable: true },
    {
      id: 'price',
      header: 'Price',
      accessorKey: 'price',
      sortable: true,
      cell: (value) => `R${parseFloat(value).toFixed(2)}`,
    },
    {
      id: 'duration_minutes',
      header: 'Duration (min)',
      accessorKey: 'duration_minutes',
      sortable: true,
    },
    {
      id: 'is_active',
      header: 'Active',
      accessorKey: 'is_active',
      cell: (v) => (v ? 'Yes' : 'No'),
    },
    {
      id: 'display_order',
      header: 'Order',
      accessorKey: 'display_order',
      sortable: true,
    },
  ];
  const [editingRequirement, setEditingRequirement] =
    useState<RequirementRow | null>(null);
  const [deleteRequirement, setDeleteRequirement] =
    useState<RequirementRow | null>(null);
  const requirementActions: TableAction[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit2,
      onClick: (row) => setEditingRequirement(row),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: (row) => setDeleteRequirement(row),
      variant: 'destructive',
    },
  ];

  const categoryColumns: TableColumn<(typeof categories)[number]>[] = [
    {
      id: 'image',
      header: 'Image',
      accessorKey: 'image_url',
      sortable: false,
      cell: (value) =>
        value ? (
          <Image src={`${value}`} alt="Category" width={40} height={40} />
        ) : (
          <span className="text-xs text-slate-400">No Image</span>
        ),
    },
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      sortable: false,
    },
    {
      id: 'charge_type',
      header: 'Charge Type',
      accessorKey: 'charge_type',
      sortable: true,
    },
    {
      id: 'is_active',
      header: 'Status',
      accessorKey: 'is_active',
      sortable: true,
    },
  ];
  const categoryActions: TableAction[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit2,
      onClick: (row) => setEditingCategory(row),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: (row) => setDeleteCategory(row),
      variant: 'destructive',
    },
  ];

  const serviceColumns: TableColumn<(typeof services)[number]>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category_id',
      sortable: false,
      cell: (value) => {
        const cat = categories.find((c) => c.id === value);
        return <span>{cat?.name || '—'}</span>;
      },
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      sortable: false,
    },
    {
      id: 'base_price',
      header: 'Base Price',
      accessorKey: 'base_price',
      sortable: true,
      cell: (value) => `R${parseFloat(value).toFixed(2)}`,
    },
    {
      id: 'platform_fee',
      header: 'Platform Fee',
      accessorKey: 'platform_fee',
      sortable: true,
      cell: (value) => `${parseFloat(value).toFixed(2)}%`,
    },
    {
      id: 'duration_minutes',
      header: 'Duration (min)',
      accessorKey: 'duration_minutes',
      sortable: true,
    },
    {
      id: 'is_active',
      header: 'Status',
      accessorKey: 'is_active',
      cell: (value) => (
        <span
          className={
            value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: '500',
          }}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];
  const serviceActions: TableAction[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit2,
      onClick: (row) => setEditingService(row),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: (row) => setDeleteService(row),
      variant: 'destructive',
    },
  ];

  const optionColumns: TableColumn<ServiceOption>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (value) => {
        if (!value) return '—';
        return value
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase());
      },
    },
    {
      id: 'service',
      header: 'Service',
      accessorKey: 'service_id',
      sortable: false,
      cell: (value) => {
        const svc = services.find((s) => s.id === value);
        return <span>{svc?.name || '—'}</span>;
      },
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      sortable: false,
    },
    {
      id: 'price',
      header: 'Price',
      accessorKey: 'price',
      sortable: true,
      cell: (value) => `R${parseFloat(value).toFixed(2)}`,
    },
    {
      id: 'platform_fee',
      header: 'Platform Fee',
      accessorKey: 'platform_fee',
      sortable: true,
      cell: (value) => `${parseFloat(value).toFixed(2)}%`,
    },
    {
      id: 'duration_minutes',
      header: 'Duration (min)',
      accessorKey: 'duration_minutes',
      sortable: true,
    },
    {
      id: 'is_required',
      header: 'Required',
      accessorKey: 'is_required',
      cell: (value) => (value ? 'Yes' : 'No'),
    },
    {
      id: 'display_order',
      header: 'Order',
      accessorKey: 'display_order',
      sortable: true,
    },
    {
      id: 'is_active',
      header: 'Status',
      accessorKey: 'is_active',
      cell: (value) => (
        <span
          className={
            value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: '500',
          }}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];
  const optionActions: TableAction[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit2,
      onClick: (row) => setEditingOption(row),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: (row) => setDeleteOption(row),
      variant: 'destructive',
    },
  ];

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
      <div>
        <h1 className="text-3xl font-bold mb-1">Services</h1>
        <p className="text-gray-600 mb-6">Manage your service offerings</p>
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant={activeTab === 'categories' ? 'default' : 'outline'}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </Button>
          <Button
            variant={activeTab === 'services' ? 'default' : 'outline'}
            onClick={() => setActiveTab('services')}
          >
            Services
          </Button>
          <Button
            variant={activeTab === 'requirements' ? 'default' : 'outline'}
            onClick={() => setActiveTab('requirements')}
          >
            Requirements
          </Button>
          <Button
            variant={activeTab === 'options' ? 'default' : 'outline'}
            onClick={() => setActiveTab('options')}
          >
            Options
          </Button>
        </div>
        {/* Tab Content */}
        {activeTab === 'requirements' && (
          <DataTable
            config={{
              data: requirementsData,
              columns: requirementColumns,
              actions: requirementActions,
              isLoading: requirementsLoading,
              pageSize: 10,
              showSearch: true,
              showPagination: true,
              emptyState: {
                title: 'No requirements',
                description: 'No service requirements found.',
              },
            }}
          />
        )}
        {activeTab === 'categories' && (
          <DataTable
            config={{
              data: categories,
              columns: categoryColumns,
              actions: categoryActions,
              isLoading: categoriesLoading,
              pageSize: 10,
              showSearch: true,
              showPagination: true,
              emptyState: {
                title: 'No categories',
                description:
                  'No categories found. Create your first service category.',
              },
            }}
          />
        )}
        {activeTab === 'services' && (
          <DataTable
            config={{
              data: services,
              columns: serviceColumns,
              actions: serviceActions,
              isLoading: servicesLoading,
              pageSize: 10,
              showSearch: true,
              showPagination: true,
              emptyState: {
                title: 'No services',
                description: 'No services found. Create your first service.',
              },
            }}
          />
        )}
        {activeTab === 'options' && (
          <DataTable
            config={{
              data: optionsData || [],
              columns: optionColumns,
              actions: optionActions,
              isLoading: optionsLoading,
              pageSize: 10,
              showSearch: true,
              showPagination: true,
              emptyState: {
                title: 'No options',
                description:
                  'No service options found. Create your first option.',
              },
            }}
          />
        )}
      </div>
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
      {/* Edit Requirement Modal (for requirements tab) */}
      {editingRequirement && (
        <ServiceRequirementEditModal
          open={!!editingRequirement}
          requirement={editingRequirement}
          onOpenChange={(open) => {
            if (!open) setEditingRequirement(null);
          }}
          onSuccess={() => setEditingRequirement(null)}
        />
      )}
      {/* Delete Requirement Dialog (for requirements tab) */}
      <DeleteConfirmationDialog
        open={!!deleteRequirement}
        onOpenChange={(open) => {
          if (!open) setDeleteRequirement(null);
        }}
        title="Delete Requirement"
        itemName={deleteRequirement?.name}
        onConfirm={() => {
          if (!deleteRequirement) return;
          deleteRequirementMutation.mutate(deleteRequirement.id, {
            onSuccess: () => {
              setDeleteRequirement(null);
            },
          });
        }}
        isDeleting={deleteRequirementMutation.isPending}
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
              },
            },
          );
        }}
        isDeleting={deleteOptionMutation.isPending}
      />
    </div>
  );
}
