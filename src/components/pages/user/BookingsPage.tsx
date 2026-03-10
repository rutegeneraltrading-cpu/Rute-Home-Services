'use client';

import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { DataTable, Loading } from '@/components/common';
import { TableAction, TableColumn } from '@/lib/types/table';
import type { Booking } from '@/lib/types/bookings';
import { useGetBookings } from '@/lib/client/api/bookings/bookings.query';

const BookingsPage = () => {
  const router = useRouter();
  const { data: bookings = [], isLoading } = useGetBookings();

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'assigned':
        return 'bg-indigo-100 text-indigo-700';
      case 'in_progress':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAssignmentStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'accepted':
        return 'bg-blue-100 text-blue-700';
      case 'declined':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const columns: TableColumn<Booking>[] = [
    {
      id: 'id',
      header: 'Booking ID',
      accessorKey: 'id',
      sortable: true,
      cell: (value) => (
        <span className="font-semibold text-gray-900 font-mono text-xs">
          {String(value).slice(0, 8)}
        </span>
      ),
    },
    {
      id: 'service_name',
      header: 'Service',
      accessorKey: 'service_name',
      sortable: true,
      cell: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">
            {String(value || '-')}
          </div>
          <div className="text-sm text-gray-500">
            {String(row.service_category || '-')}
          </div>
        </div>
      ),
    },
    {
      id: 'booking_schedule',
      header: 'Schedule',
      accessorKey: 'booking_date',
      sortable: true,
      cell: (_value, row) => (
        <div>
          <div className="text-gray-900">{row.booking_date}</div>
          <div className="text-sm text-gray-500">{row.booking_time}</div>
        </div>
      ),
    },
    {
      id: 'total_price',
      header: 'Total',
      accessorKey: 'total_price',
      sortable: true,
      cell: (value) => (
        <span className="font-semibold text-gray-900">
          R{parseFloat(String(value || 0)).toFixed(2)}
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
            {String(value)}
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
          className={`${getStatusColor(value as Booking['status'])} px-3 py-1 rounded-full text-xs font-semibold capitalize`}
        >
          {String(value)}
        </span>
      ),
    },
    {
      id: 'assignment_status',
      header: 'Assignment',
      accessorKey: 'assignment_status',
      sortable: true,
      cell: (value) => {
        if (!value) return <span className="text-gray-400">-</span>;
        return (
          <span
            className={`${getAssignmentStatusColor(String(value))} px-2 py-1 rounded-full text-xs font-semibold capitalize`}
          >
            {String(value)}
          </span>
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
        router.push(`/user/bookings/${String(row.id)}`);
      },
    },
  ];

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">
            View and track your service bookings
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">
            You haven&apos;t created any bookings yet.
          </p>
        </div>
      ) : (
        <DataTable<Booking>
          config={{
            data: bookings,
            columns,
            actions,
            isLoading: false,
            pageSize: 10,
            defaultSortBy: 'created_at',
            defaultSortOrder: 'desc',
          }}
        />
      )}
    </div>
  );
};

export default BookingsPage;
