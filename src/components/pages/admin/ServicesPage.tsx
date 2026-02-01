'use client';

import { useState } from 'react';
import { DataTable } from '@/components/common';
import { DataTableConfig, TableColumn, TableAction } from '@/lib/types/table';
import { useGetServices } from '@/lib/client/api/services';
import { useDeleteService } from '@/lib/client/api/services';
import { Service } from '@/lib/client/api/services/services.api';
import { Edit2, Trash2, Eye } from 'lucide-react';

const ServicesPage = () => {
  const { data: services = [], isLoading } = useGetServices();
  const deleteServiceMutation = useDeleteService();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const columns: TableColumn<Service>[] = [
    {
      id: 'name',
      header: 'Service Name',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
    {
      id: 'price',
      header: 'Price',
      accessorKey: 'price',
      sortable: true,
      cell: (value) => `$${value}`,
    },
    {
      id: 'duration_minutes',
      header: 'Duration (mins)',
      accessorKey: 'duration_minutes',
      sortable: true,
    },
    {
      id: 'created_at',
      header: 'Created',
      accessorKey: 'created_at',
      cell: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const actions: TableAction[] = [
    {
      id: 'view',
      label: 'View',
      icon: Eye,
      onClick: (row) => console.log('View:', row),
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit2,
      onClick: (row) => console.log('Edit:', row),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: (row) => {
        if (confirm(`Delete service "${row.name}"?`)) {
          setDeletingId(row.id);
          deleteServiceMutation.mutate(row.id, {
            onSuccess: () => {
              setDeletingId(null);
            },
            onError: () => {
              setDeletingId(null);
            },
          });
        }
      },
      variant: 'destructive',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Services</h1>
      </div>

      <DataTable<Service>
        config={{
          data: services,
          columns,
          actions,
          isLoading: isLoading || deleteServiceMutation.isPending,
        }}
      />
    </div>
  );
};

export default ServicesPage;
