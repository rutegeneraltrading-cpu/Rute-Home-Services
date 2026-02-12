'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableColumn, TableAction } from '@/lib/types/table';
import { DataTable, CustomCalendar } from '@/components/common';

type BookingStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  service_name: string;
  worker_name: string;
  total_price: number;
  status: BookingStatus;
  start_time: string;
  end_time: string;
  created_at: string;
}

const mockBookings: Booking[] = [
  {
    id: '1',
    booking_number: 'BK-2026-001',
    customer_name: 'Ahmed Khan',
    customer_email: 'ahmed@example.com',
    service_name: 'Deep Cleaning',
    worker_name: 'Ayesha Noor',
    total_price: 850,
    status: 'confirmed',
    start_time: '2026-02-03T09:00:00Z',
    end_time: '2026-02-03T11:00:00Z',
    created_at: '2026-02-02T16:20:00Z',
  },
  {
    id: '2',
    booking_number: 'BK-2026-002',
    customer_name: 'Fatima Ali',
    customer_email: 'fatima@example.com',
    service_name: 'AC Repair',
    worker_name: 'Usman Tariq',
    total_price: 1200,
    status: 'scheduled',
    start_time: '2026-02-03T12:30:00Z',
    end_time: '2026-02-03T14:00:00Z',
    created_at: '2026-02-03T08:40:00Z',
  },
  {
    id: '3',
    booking_number: 'BK-2026-003',
    customer_name: 'Hassan Ibrahim',
    customer_email: 'hassan@example.com',
    service_name: 'Plumbing Fix',
    worker_name: 'Sana Mirza',
    total_price: 600,
    status: 'completed',
    start_time: '2026-02-02T10:00:00Z',
    end_time: '2026-02-02T11:30:00Z',
    created_at: '2026-02-01T15:10:00Z',
  },
  {
    id: '4',
    booking_number: 'BK-2026-004',
    customer_name: 'Zainab Muhammad',
    customer_email: 'zainab@example.com',
    service_name: 'Painter Visit',
    worker_name: 'Bilal Ahmed',
    total_price: 1450,
    status: 'cancelled',
    start_time: '2026-02-02T15:00:00Z',
    end_time: '2026-02-02T17:00:00Z',
    created_at: '2026-02-01T09:30:00Z',
  },
  {
    id: '5',
    booking_number: 'BK-2026-005',
    customer_name: 'Omar Abdullah',
    customer_email: 'omar@example.com',
    service_name: 'Appliance Maintenance',
    worker_name: 'Hina Yusuf',
    total_price: 980,
    status: 'confirmed',
    start_time: '2026-02-04T08:30:00Z',
    end_time: '2026-02-04T10:00:00Z',
    created_at: '2026-02-03T14:05:00Z',
  },
];

const BookingsPage = () => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'scheduled':
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

  const calendarEvents = useMemo(
    () =>
      bookings.map((booking) => ({
        id: booking.id,
        title: `${booking.service_name} • ${booking.customer_name}`,
        start: new Date(booking.start_time),
        end: new Date(booking.end_time),
        status: booking.status,
      })),
    [bookings],
  );

  const columns: TableColumn<Booking>[] = [
    {
      id: 'booking_number',
      header: 'Booking #',
      accessorKey: 'booking_number',
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
      id: 'service_name',
      header: 'Service',
      accessorKey: 'service_name',
      sortable: true,
      cell: (value, row) => (
        <div>
          <div className="text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.worker_name}</div>
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
      id: 'start_time',
      header: 'Schedule',
      accessorKey: 'start_time',
      sortable: true,
      cell: (value, row) => {
        const start = new Date(value);
        const end = new Date(row.end_time);
        return (
          <div>
            <div className="text-gray-900">{start.toLocaleDateString()}</div>
            <div className="text-sm text-gray-500">
              {start.toLocaleTimeString()} - {end.toLocaleTimeString()}
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
        toast.info(`Viewing booking: ${row.booking_number}`);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: (row) => {
        if (confirm(`Delete booking "${row.booking_number}"?`)) {
          setDeletingId(row.id);
          setTimeout(() => {
            setBookings((prev) => prev.filter((b) => b.id !== row.id));
            setDeletingId(null);
            toast.success('Booking deleted successfully');
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
        <div className="relative rounded-lg border bg-white p-4 shadow-sm">
          <CustomCalendar events={calendarEvents} loading={false} />
        </div>
      ) : (
        <DataTable<Booking>
          config={{
            data: bookings,
            columns,
            actions,
            isLoading: deletingId !== null,
            pageSize: 10,
            defaultSortBy: 'start_time',
            defaultSortOrder: 'desc',
          }}
        />
      )}
    </div>
  );
};

export default BookingsPage;
