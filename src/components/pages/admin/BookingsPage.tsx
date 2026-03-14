'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableColumn, TableAction } from '@/lib/types/table';
import { DataTable, CustomCalendar } from '@/components/common';
import { useGetBookings } from '@/lib/client/api/bookings/bookings.query';
import type { Booking } from '@/lib/types/bookings';
import { Loading } from '@/components/common';
import { BookingEditModal } from './modals/BookingEditModal';

type AdminBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

type AssignmentStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'completed'
  | 'cancelled';

const parseTimeLabelToMinutes = (value: string): number | null => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
  if (!match) return null;

  const rawHour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (rawHour < 1 || rawHour > 12 || minute < 0 || minute > 59) return null;

  let hour24 = rawHour % 12;
  if (meridiem === 'PM') hour24 += 12;

  return hour24 * 60 + minute;
};

const toDateRange = (booking: Booking) => {
  const [startLabel, endLabel] = String(booking.booking_time || '').split(
    ' to ',
  );
  const startMinutes = startLabel ? parseTimeLabelToMinutes(startLabel) : null;
  const endMinutes = endLabel ? parseTimeLabelToMinutes(endLabel) : null;

  const start = new Date(`${booking.booking_date}T00:00:00`);
  if (startMinutes === null) {
    return {
      start,
      end: new Date(start.getTime() + booking.total_duration * 60 * 1000),
    };
  }

  start.setMinutes(startMinutes);

  const computedEndMinutes =
    endMinutes !== null
      ? endMinutes
      : startMinutes + Number(booking.total_duration || 0);
  const end = new Date(`${booking.booking_date}T00:00:00`);
  end.setMinutes(computedEndMinutes);

  return { start, end };
};

const BookingsPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const { data: bookings = [], isLoading } = useGetBookings();

  const getStatusColor = (status: AdminBookingStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'assigned':
        return 'bg-green-100 text-indigo-700';
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

  const getAssignmentStatusColor = (status: AssignmentStatus) => {
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

  const calendarEvents = useMemo(
    () =>
      bookings.map((booking) => ({
        id: booking.id,
        title: `${booking.service_name || 'Service'} • ${booking.customer_name || 'Customer'}`,
        start: toDateRange(booking).start,
        end: toDateRange(booking).end,
        status: booking.status,
        workerName: booking.assigned_worker_name,
        workerEmail: booking.assigned_worker_email,
        assignmentStatus: booking.assignment_status,
        onEdit: (eventId: string) => {
          const booking = bookings.find((b) => b.id === eventId);
          if (booking) setEditingBooking(booking);
        },
        onView: (eventId: string) => {
          router.push(`/admin/bookings/${eventId}`);
        },
      })),
    [bookings, router],
  );

  const columns: TableColumn<Booking>[] = [
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
      id: 'customer_name',
      header: 'Customer',
      accessorKey: 'customer_name',
      sortable: true,
      cell: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">
            {String(value || '-')}
          </div>
          <div className="text-sm text-gray-500">
            {String(row.customer_email || '-')}
          </div>
        </div>
      ),
    },
    {
      id: 'service_name',
      header: 'Service',
      accessorKey: 'service_name',
      sortable: true,
      cell: (value, row) => (
        <div>
          <div className="text-gray-900">{String(value || '-')}</div>
          <div className="text-sm text-gray-500">
            {String(row.service_category || '-')}
          </div>
        </div>
      ),
    },
    {
      id: 'assigned_worker_name',
      header: 'Assigned Worker',
      accessorKey: 'assigned_worker_name',
      sortable: true,
      cell: (value, row) => (
        <div>
          <div className="text-gray-900">{String(value || '-')}</div>
          <div className="text-sm text-gray-500">
            {String(row.assigned_worker_email || '-')}
          </div>
        </div>
      ),
    },
    {
      id: 'assignment_status',
      header: 'Assign Status',
      accessorKey: 'assignment_status',
      sortable: true,
      cell: (value) => {
        if (!value) return <span className="text-gray-400">-</span>;
        return (
          <span
            className={`${getAssignmentStatusColor(value as AssignmentStatus)} px-2 py-1 rounded-full text-xs font-semibold capitalize`}
          >
            {String(value)}
          </span>
        );
      },
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
      id: 'booking_schedule',
      header: 'Schedule',
      accessorKey: 'booking_date',
      sortable: false,
      cell: (_value, row) => {
        return (
          <div>
            <div className="text-gray-900">{row.booking_date}</div>
            <div className="text-sm text-gray-500">{row.booking_time}</div>
          </div>
        );
      },
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
          className={`${getStatusColor(value as AdminBookingStatus)} px-3 py-1 rounded-full text-xs font-semibold capitalize`}
        >
          {String(value)}
        </span>
      ),
    },
  ];

  const actions: TableAction[] = [
    {
      id: 'edit',
      label: 'Update Booking',
      icon: Edit2,
      onClick: (row) => {
        setEditingBooking(row as Booking);
      },
    },
    {
      id: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => {
        router.push(`/admin/bookings/${String(row.id)}`);
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
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">
            Manage bookings with calendar and list views
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={activeTab === 'calendar' ? 'default' : 'outline'}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar View
        </Button>
        <Button
          variant={activeTab === 'list' ? 'default' : 'outline'}
          onClick={() => setActiveTab('list')}
        >
          List View
        </Button>
      </div>

      {activeTab === 'calendar' ? (
        <div className="relative rounded-lg border bg-white p-4 shadow-sm overflow-x-auto">
          <div className="min-w-240">
            <CustomCalendar events={calendarEvents} loading={false} />
          </div>
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

      <BookingEditModal
        open={!!editingBooking}
        booking={editingBooking}
        onOpenChange={(open) => {
          if (!open) setEditingBooking(null);
        }}
        onSuccess={() => {
          setEditingBooking(null);
        }}
      />
    </div>
  );
};

export default BookingsPage;
