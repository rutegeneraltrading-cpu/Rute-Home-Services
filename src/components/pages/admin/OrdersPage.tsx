'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/common';
import { Button } from '@/components/ui/button';
import { TableColumn, TableAction } from '@/lib/types/table';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  items_count: number;
}

// Mock orders data
const mockOrders: Order[] = [
  {
    id: '1',
    order_number: 'ORD-2026-001',
    customer_name: 'Ahmed Khan',
    customer_email: 'ahmed@example.com',
    total_price: 2450.0,
    status: 'confirmed',
    created_at: '2026-02-03T10:30:00Z',
    items_count: 3,
  },
  {
    id: '2',
    order_number: 'ORD-2026-002',
    customer_name: 'Fatima Ali',
    customer_email: 'fatima@example.com',
    total_price: 1200.0,
    status: 'pending',
    created_at: '2026-02-03T09:15:00Z',
    items_count: 2,
  },
  {
    id: '3',
    order_number: 'ORD-2026-003',
    customer_name: 'Hassan Ibrahim',
    customer_email: 'hassan@example.com',
    total_price: 3890.0,
    status: 'completed',
    created_at: '2026-02-02T14:20:00Z',
    items_count: 5,
  },
  {
    id: '4',
    order_number: 'ORD-2026-004',
    customer_name: 'Zainab Muhammad',
    customer_email: 'zainab@example.com',
    total_price: 890.0,
    status: 'cancelled',
    created_at: '2026-02-02T11:45:00Z',
    items_count: 1,
  },
  {
    id: '5',
    order_number: 'ORD-2026-005',
    customer_name: 'Omar Abdullah',
    customer_email: 'omar@example.com',
    total_price: 5670.0,
    status: 'confirmed',
    created_at: '2026-02-01T16:30:00Z',
    items_count: 8,
  },
];

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [isLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const columns: TableColumn<Order>[] = [
    {
      id: 'order_number',
      header: 'Order Number',
      accessorKey: 'order_number',
      sortable: true,
      cell: (value) => (
        <span className="font-semibold text-gray-900">{value}</span>
      ),
    },
    {
      id: 'customer_name',
      header: 'Customer',
      accessorKey: 'customer_name',
      sortable: true,
      cell: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.customer_email}</div>
        </div>
      ),
    },
    {
      id: 'items_count',
      header: 'Items',
      accessorKey: 'items_count',
      sortable: true,
      cell: (value) => (
        <span className="text-gray-700">
          {value} item{value !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      id: 'total_price',
      header: 'Total',
      accessorKey: 'total_price',
      sortable: true,
      cell: (value) => (
        <span className="font-semibold text-gray-900">
          R{parseFloat(value).toFixed(2)}
        </span>
      ),
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
      id: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => {
        toast.info(`Viewing order: ${row.order_number}`);
        console.log('View order:', row);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: (row) => {
        if (confirm(`Delete order "${row.order_number}"?`)) {
          setDeletingId(row.id);
          // Simulate delete
          setTimeout(() => {
            setOrders(orders.filter((o) => o.id !== row.id));
            setDeletingId(null);
            toast.success('Order deleted successfully');
          }, 500);
        }
      },
      variant: 'destructive',
    },
  ];

  return (
    <div className="space-y-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">
            Manage customer orders and track deliveries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export</Button>
        </div>
      </div>

      <DataTable<Order>
        config={{
          data: orders,
          columns,
          actions,
          isLoading: isLoading || deletingId !== null,
          pageSize: 10,
          defaultSortBy: 'created_at',
          defaultSortOrder: 'desc',
        }}
      />
    </div>
  );
};

export default OrdersPage;
