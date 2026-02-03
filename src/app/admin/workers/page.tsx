'use client';

import { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { DataTable, DeleteConfirmationDialog } from '@/components/common';
import { DataTableConfig, TableColumn, TableAction } from '@/lib/types/table';
import { Worker, useGetWorkers, useDeleteWorker } from '@/lib/client/api';

import { Button } from '@/components/ui/button';
import { WorkerForm } from '@/components/pages/admin/workerform';
import { WorkerEditModal } from '@/components/pages/admin/workerform/WorkerEditModal';

const Workers = () => {
  const { data, isLoading } = useGetWorkers();
  const workers = data?.workers || [];
  const deleteWorkerMutation = useDeleteWorker();
  const [isWorkerFormOpen, setIsWorkerFormOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null);

  const columns: TableColumn<Worker>[] = [
    {
      id: 'full_name',
      header: 'Name',
      accessorKey: 'full_name',
      sortable: true,
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      sortable: true,
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone',
      sortable: false,
      cell: (value) => value || '-',
    },
    {
      id: 'hourly_rate',
      header: 'Hourly Rate',
      accessorKey: 'hourly_rate',
      sortable: true,
      cell: (value) => (value ? `R${parseFloat(value).toFixed(2)}` : '-'),
    },
    {
      id: 'rating_avg',
      header: 'Rating',
      accessorKey: 'rating_avg',
      sortable: true,
      cell: (value) => (value ? `${parseFloat(value).toFixed(1)} ⭐` : 'N/A'),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            value === 'suspended'
              ? 'bg-red-100 text-red-800'
              : value === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value || 'active'}
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
      id: 'edit',
      label: 'Edit',
      icon: Edit2,
      onClick: (worker: Worker) => {
        setEditingWorker(worker);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (worker: Worker) => {
        setDeletingWorker(worker);
      },
    },
  ];

  const tableConfig: DataTableConfig<Worker> = {
    data: workers,
    columns,
    actions,
    defaultSortBy: 'created_at',
    defaultSortOrder: 'desc',
    pageSize: 10,
    showSearch: true,
    showPagination: true,
    isLoading: isLoading,
    emptyState: {
      title: 'No workers found',
      description: 'Get started by creating a new worker.',
    },
  };

  return (
    <div className="py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workers</h1>
          <p className="text-sm text-gray-600">
            Manage and view all service providers
          </p>
        </div>
        <Button onClick={() => setIsWorkerFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Worker
        </Button>
      </div>

      <DataTable<Worker> config={tableConfig} />

      <WorkerForm
        open={isWorkerFormOpen}
        onOpenChange={setIsWorkerFormOpen}
        onSuccess={() => setIsWorkerFormOpen(false)}
      />

      <WorkerEditModal
        open={!!editingWorker}
        worker={editingWorker}
        onOpenChange={(open) => {
          if (!open) setEditingWorker(null);
        }}
        onSuccess={() => setEditingWorker(null)}
      />

      <DeleteConfirmationDialog
        open={!!deletingWorker}
        onOpenChange={(open) => {
          if (!open) setDeletingWorker(null);
        }}
        title="Delete Worker"
        itemName={deletingWorker?.full_name}
        description="This will permanently delete the worker account and profile."
        onConfirm={() => {
          if (!deletingWorker) return;
          deleteWorkerMutation.mutate(deletingWorker.id, {
            onSuccess: () => {
              setDeletingWorker(null);
            },
          });
        }}
        isDeleting={deleteWorkerMutation.isPending}
      />
    </div>
  );
};

export default Workers;
