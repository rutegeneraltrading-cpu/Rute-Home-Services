'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Eye, Pencil } from 'lucide-react';
import { DataTable, Loading } from '@/components/common';
import { TableAction, TableColumn } from '@/lib/types/table';
import type { Booking } from '@/lib/types/bookings';
import { useGetBookings } from '@/lib/client/api/bookings/bookings.query';
import { usePayFastPayment } from '@/lib/client/api/bookings/payments.mutation';
import { useGetProfile } from '@/lib/client/api/profile/profile.query';
import EditBookingModal from './Booking/EditBookingModal';

const EDIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const isWithinEditWindow = (createdAt: string) => {
  return Date.now() - new Date(createdAt).getTime() < EDIT_WINDOW_MS;
};

const PayNowActionIcon = ({ className }: { className?: string }) => (
  <span className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap bg-black rounded-full text-white px-2 py-1 hover:bg-black/80">
    Pay Now
    <CreditCard className={className} />
  </span>
);

const BookingsPage = () => {
  const router = useRouter();
  const { data: bookings = [], isLoading } = useGetBookings();
  const { data: profile } = useGetProfile();
  const payFastPaymentMutation = usePayFastPayment();

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

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
      sortable: true,
      cell: (_value, row) => {
        // Multi-worker: show first active assignment status or fallback
        const activeAssignment = Array.isArray(row.assignments)
          ? row.assignments.find(
              (a) => a.status === 'pending' || a.status === 'accepted',
            )
          : undefined;
        const status = activeAssignment?.status || '';
        if (!status) return <span className="text-gray-400">-</span>;
        return (
          <span
            className={`${getAssignmentStatusColor(status)} px-2 py-1 rounded-full text-xs font-semibold capitalize`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  const actions: TableAction[] = [
    {
      id: 'pay-now',
      label: 'Pay Now',
      icon: PayNowActionIcon,
      variant: 'outline',
      showWhen: (row) => row.payment_status === 'pending',
      onClick: async (row) => {
        const booking = row as Booking;
        const fullName = profile?.full_name || 'Customer User';
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ') || 'User';

        await payFastPaymentMutation.mutateAsync({
          booking_id: booking.id,
          user_id: booking.user_id,
          first_name: firstName || 'Customer',
          last_name: lastName,
          email: booking.customer_email || profile?.email || '',
          phone: booking.customer_phone || profile?.phone || undefined,
          total_price: Number(booking.total_price || 0),
          service_name: booking.service_name || 'Service Booking',
          service_description: booking.service_details?.description || '',
        });
      },
    },
    {
      id: 'edit',
      label: 'Edit Booking',
      icon: Pencil,
      variant: 'outline',
      showWhen: (row) => {
        const booking = row as Booking;
        return (
          isWithinEditWindow(booking.created_at) &&
          booking.status !== 'completed' &&
          booking.status !== 'cancelled'
        );
      },
      onClick: (row) => {
        setEditingBooking(row as Booking);
      },
    },
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
            minTableWidth: 1300,
            isLoading: payFastPaymentMutation.isPending,
            pageSize: 10,
            defaultSortBy: 'created_at',
            defaultSortOrder: 'desc',
          }}
        />
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          open={Boolean(editingBooking)}
          onOpenChange={(open) => {
            if (!open) setEditingBooking(null);
          }}
        />
      )}
    </div>
  );
};

export default BookingsPage;
