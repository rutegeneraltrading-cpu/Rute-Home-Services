'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { DataTable, Loading } from '@/components/common';
import { useGetOrders } from '@/lib/client/api/orders/orders.query';
import { useGetBookings } from '@/lib/client/api/bookings/bookings.query';
import { TableAction, TableColumn } from '@/lib/types/table';
import type { Order } from '@/lib/types/orders';
import type { Booking } from '@/lib/types/bookings';

type PaymentHistoryRow = {
  id: string;
  resource_id: string;
  transaction_id: string | null;
  type: 'order' | 'service';
  amount: number;
  payment_status: 'paid';
  created_at: string;
};

const PaymentHistoryPage = () => {
  const router = useRouter();
  const { data: orders = [], isLoading: isOrdersLoading } = useGetOrders();
  const { data: bookings = [], isLoading: isBookingsLoading } =
    useGetBookings();

  const paymentRows = useMemo<PaymentHistoryRow[]>(() => {
    const paidOrders = (orders as Order[])
      .filter((order) => order.payment_status === 'paid')
      .map((order) => ({
        id: `order-${order.id}`,
        resource_id: order.id,
        transaction_id: order.payfast_transaction_id || null,
        type: 'order' as const,
        amount: Number(order.total || 0),
        payment_status: 'paid' as const,
        created_at: order.created_at,
      }));

    const paidBookings = (bookings as Booking[])
      .filter((booking) => booking.payment_status === 'paid')
      .map((booking) => ({
        id: `service-${booking.id}`,
        resource_id: booking.id,
        transaction_id: booking.payfast_transaction_id || null,
        type: 'service' as const,
        amount: Number(booking.total_price || 0),
        payment_status: 'paid' as const,
        created_at: booking.created_at,
      }));

    return [...paidOrders, ...paidBookings].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [orders, bookings]);

  const columns: TableColumn<PaymentHistoryRow>[] = [
    {
      id: 'transaction_id',
      header: 'Transaction ID',
      accessorKey: 'transaction_id',
      sortable: true,
      cell: (value) => (
        <span className="font-semibold text-gray-900 font-mono text-xs">
          {value ? String(value) : '-'}
        </span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize bg-indigo-100 text-indigo-700">
          {String(value)}
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (value) => (
        <span className="font-semibold text-gray-900">
          R{Number(value || 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: 'payment_status',
      header: 'Payment Status',
      accessorKey: 'payment_status',
      sortable: true,
      cell: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize bg-green-100 text-green-700">
          {String(value)}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Date',
      accessorKey: 'created_at',
      sortable: true,
      cell: (value) => {
        const date = new Date(String(value));
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
        const item = row as PaymentHistoryRow;
        if (item.type === 'service') {
          router.push(`/user/bookings/${item.resource_id}`);
          return;
        }

        router.push(`/user/orders/${item.resource_id}`);
      },
    },
  ];

  if (isOrdersLoading || isBookingsLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-1">
            Paid transactions from your orders and service bookings
          </p>
        </div>
      </div>

      {paymentRows.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No paid transactions found yet.</p>
        </div>
      ) : (
        <DataTable<PaymentHistoryRow>
          config={{
            data: paymentRows,
            columns,
            actions,
            minTableWidth: 900,
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

export default PaymentHistoryPage;
