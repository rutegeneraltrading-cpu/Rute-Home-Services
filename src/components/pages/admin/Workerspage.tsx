'use client';

import { DataTable } from '@/components/common';
import { DataTableConfig, TableColumn, TableAction } from '@/lib/types/table';
import { useGetWorkers } from '@/lib/client/api/workers';
import { useDeleteWorker } from '@/lib/client/api/workers';
import type { Worker } from '@/lib/client/api/workers';
import { Edit2, Trash2, Eye, Star } from 'lucide-react';
import { useState } from 'react';

export default function WorkersPage() {
  const { data, isLoading } = useGetWorkers();
  const workers = data?.workers || [];
  const deleteWorkerMutation = useDeleteWorker();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const columns: TableColumn<Worker>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      sortable: true,
    },
    {
      id: 'service_category',
      header: 'Service Category',
      accessorKey: 'service_category',
      sortable: true,
      cell: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
          {value}
        </span>
      ),
    },
    {
      id: 'rating',
      header: 'Rating',
      accessorKey: 'rating',
      sortable: true,
      cell: (value) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold">{value.toFixed(1)}</span>
        </div>
      ),
    },
    {
      id: 'hourly_rate',
      header: 'Hourly Rate',
      accessorKey: 'hourly_rate',
      sortable: true,
      cell: (value) => `$${value}/hr`,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            value === 'active'
              ? 'bg-green-100 text-green-800'
              : value === 'inactive'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Joined',
      accessorKey: 'created_at',
      sortable: true,
      cell: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const actions: TableAction[] = [
    {
      id: 'view',
      label: 'View',
      icon: Eye,
      onClick: (worker: Worker) => {
        console.log('View worker:', worker);
      },
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit2,
      onClick: (worker: Worker) => {
        console.log('Edit worker:', worker);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (worker: Worker) => {
        setDeletingId(worker.id);
        deleteWorkerMutation.mutate(worker.id, {
          onSuccess: () => {
            setDeletingId(null);
          },
        });
      },
    },
  ];

  const tableConfig: DataTableConfig<Worker> = {
    data: workers,
    columns,
    actions,
    defaultSortBy: 'rating',
    defaultSortOrder: 'desc',
    pageSize: 10,
    showSearch: true,
    showPagination: true,
    isLoading: isLoading || deletingId !== null,
    emptyState: {
      title: 'No workers found',
      description: 'Get started by onboarding a new worker.',
    },
  };

  return (
    <div className="p-6">
      <DataTable<Worker>
        config={tableConfig}
        title="Workers"
        description="Manage and view all service workers in your system"
      />
    </div>
  );
}
