'use client';

import { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  WorkerForm,
  WorkerEditModal,
} from '@/components/pages/admin/workerform';
import { useGetWorkers, useDeleteWorker } from '@/lib/client/api';
import { DataTable, DeleteConfirmationDialog } from '@/components/common';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DataTableConfig, TableColumn, TableAction } from '@/lib/types';
import type { WorkerProfileWithDetails } from '@/lib/client/api/workers/workers.api';

const WorkersPage = () => {
  const { data, isLoading } = useGetWorkers();
  const workers: WorkerProfileWithDetails[] = data?.workers || [];
  const deleteWorkerMutation = useDeleteWorker();
  const [isWorkerFormOpen, setIsWorkerFormOpen] = useState(false);
  const [editingWorker, setEditingWorker] =
    useState<WorkerProfileWithDetails | null>(null);
  const [deletingWorker, setDeletingWorker] =
    useState<WorkerProfileWithDetails | null>(null);

  const columns: TableColumn<WorkerProfileWithDetails>[] = [
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
      id: 'service_category_names',
      header: 'Service Category',
      accessorKey: 'service_category_names',
      sortable: false,
      cell: (value, row) => {
        // Use service_category_details for tooltip
        const details = (row?.service_category_details || []) as {
          name: string;
          charge_type: string;
        }[];
        const categories =
          Array.isArray(value) && value.length > 0 ? value : [];
        return categories.length > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-pointer underline decoration-dotted">
                {categories.join(', ')}
              </span>
            </TooltipTrigger>
            <TooltipContent
              className="bg-white border text-black-700"
              align="start"
            >
              <div className="max-w-xs">
                <div className="font-semibold mb-1">Selected Categories:</div>
                <ol className="text-xs list-decimal list-inside">
                  {details.map((cat: { name: string; charge_type: string }) => (
                    <li key={cat.name}>{`${cat.name} (${cat.charge_type})`}</li>
                  ))}
                </ol>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          '-'
        );
      },
    },
    {
      id: 'service_names',
      header: 'Services',
      accessorKey: 'service_names',
      sortable: false,
      cell: (value, row) => {
        // Use service_details for tooltip
        const details = (row?.service_details || []) as {
          name: string;
          base_price: number;
          category_name: string;
          charge_type: string;
        }[];
        const services = Array.isArray(value) && value.length > 0 ? value : [];
        return services.length > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-pointer underline decoration-dotted">
                {services.join(', ')}
              </span>
            </TooltipTrigger>
            <TooltipContent
              className="bg-white border text-black-700"
              align="start"
            >
              <div className="max-w-xs">
                <div className="font-semibold mb-1">Selected Services:</div>
                <ol className="text-xs list-decimal list-inside">
                  {details.map(
                    (srv: {
                      name: string;
                      base_price: number;
                      category_name: string;
                      charge_type: string;
                    }) => (
                      <li key={srv.name}>
                        {`${srv.name} - ${srv.base_price}/${srv.charge_type} `}
                      </li>
                    ),
                  )}
                </ol>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          '-'
        );
      },
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
      onClick: (item) => {
        setEditingWorker(item as WorkerProfileWithDetails);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (item) => {
        setDeletingWorker(item as WorkerProfileWithDetails);
      },
    },
  ];

  const tableConfig: DataTableConfig<WorkerProfileWithDetails> = {
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

      <DataTable<WorkerProfileWithDetails> config={tableConfig} />

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

export default WorkersPage;
