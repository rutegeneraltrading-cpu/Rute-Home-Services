'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Trash2, Edit2 } from 'lucide-react';
import { DataTable, DeleteConfirmationDialog } from '@/components/common';
import { TableColumn, TableAction } from '@/lib/types/table';
import { useGetOrders } from '@/lib/client/api/orders/orders.query';
import type { Order } from '@/lib/types/orders';
import { Loading } from '@/components/common';
import { OrderEditModal } from './OrderEditModal';
import { useDeleteOrder } from '@/lib/client/api/orders/orders.mutation';

const OrdersPage = () => {
  const router = useRouter();
  const { data: orders = [], isLoading } = useGetOrders();
  const deleteOrderMutation = useDeleteOrder();
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
        return 'bg-purple-100 text-purple-700';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const columns: TableColumn<Order>[] = [
    {
      id: 'id',
      header: 'Order ID',
      accessorKey: 'id',
      sortable: true,
      cell: (value) => (
        <span className="font-semibold text-gray-900 font-mono text-xs">
          {String(value).slice(0, 8)}
        </span>
      ),
    },
    {
      id: 'payfast_transaction_id',
      header: 'PayFast T ID',
      accessorKey: 'payfast_transaction_id',
      sortable: true,
      cell: (value) => (
        <span className="font-semibold text-gray-900 font-mono text-xs">
          {String(value).slice(0, 8)}
        </span>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      accessorKey: 'profile',
      sortable: false,
      cell: (value) => (
        <div>
          <div className="font-medium text-gray-900">
            {value?.full_name || 'N/A'}
          </div>
          <div className="text-sm text-gray-500">{value?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      id: 'items_count',
      header: 'Items',
      accessorKey: 'items',
      sortable: false,
      cell: (value) => {
        const itemsArray = Array.isArray(value) ? value : [];
        const count = itemsArray.length;
        return (
          <span className="text-gray-700">
            {count} item{count !== 1 ? 's' : ''}
          </span>
        );
      },
    },
    {
      id: 'total',
      header: 'Total',
      accessorKey: 'total',
      sortable: true,
      cell: (value) => (
        <span className="font-semibold text-gray-900">
          R{parseFloat(value || 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: 'payment_status',
      header: 'Payment',
      accessorKey: 'payment_status',
      sortable: true,
      cell: (value) => {
        const colors = {
          pending: 'bg-yellow-100 text-yellow-700',
          paid: 'bg-green-100 text-green-700',
          failed: 'bg-red-100 text-red-700',
          refunded: 'bg-gray-100 text-gray-700',
          cancelled: 'bg-red-100 text-red-700',
        };
        return (
          <span
            className={`${colors[value as keyof typeof colors] || 'bg-gray-100 text-gray-700'} px-2 py-1 rounded-full text-xs font-semibold capitalize`}
          >
            {value}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (value) => (
        <span
          className={`${getStatusColor(value)} px-3 py-1 rounded-full text-xs font-semibold capitalize`}
        >
          {value}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Order Date',
      accessorKey: 'created_at',
      sortable: true,
      cell: (value) => {
        const date = new Date(value);
        return (
          <div>
            <div className="text-gray-900">{date.toLocaleDateString()}</div>
            <div className="text-sm text-gray-500">
              {date.toLocaleTimeString()}
            </div>
          </div>
        );
      },
    },
  ];

  const actions: TableAction[] = [
    {
      id: 'edit',
      label: 'Edit Status',
      icon: Edit2,
      onClick: (row) => setEditingOrder(row),
    },
    {
      id: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => {
        router.push(`/admin/orders/${row.id}`);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: (row) => setDeleteOrder(row),
      variant: 'destructive',
    },
  ];

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">
            Manage customer orders and track deliveries
          </p>
        </div>
      </div>

      <DataTable<Order>
        config={{
          data: orders,
          columns,
          actions,
          isLoading: deleteOrderMutation.isPending,
          pageSize: 10,
          defaultSortBy: 'created_at',
          defaultSortOrder: 'desc',
        }}
      />

      <OrderEditModal
        open={!!editingOrder}
        order={editingOrder}
        onOpenChange={(open) => {
          if (!open) setEditingOrder(null);
        }}
        onSuccess={() => setEditingOrder(null)}
      />

      <DeleteConfirmationDialog
        open={!!deleteOrder}
        onOpenChange={(open) => {
          if (!open) setDeleteOrder(null);
        }}
        title="Delete Order"
        itemName={deleteOrder ? `#${deleteOrder.id.slice(0, 8)}` : undefined}
        description="Are you sure you want to delete"
        onConfirm={() => {
          if (!deleteOrder) return;
          deleteOrderMutation.mutate(deleteOrder.id, {
            onSuccess: () => {
              setDeleteOrder(null);
            },
          });
        }}
        isDeleting={deleteOrderMutation.isPending}
      />
    </div>
  );
};

export default OrdersPage;
