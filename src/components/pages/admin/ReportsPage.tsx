'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Loading } from '@/components/common';
import { useGetBookings } from '@/lib/client/api/bookings/bookings.query';
import { useGetOrders } from '@/lib/client/api/orders/orders.query';
import type { Booking } from '@/lib/types/bookings';
import type { Order } from '@/lib/types/orders';

const monthKey = (dateString: string) => {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('default', {
    month: 'short',
    year: 'numeric',
  });
};

const ReportsPage = () => {
  const { data: bookings = [], isLoading: bookingsLoading } = useGetBookings();
  const { data: orders = [], isLoading: ordersLoading } = useGetOrders();

  const bookingStatusCounts = useMemo(() => {
    const map = new Map<string, number>();
    (bookings as Booking[]).forEach((booking) => {
      map.set(booking.status, (map.get(booking.status) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [bookings]);

  const orderStatusCounts = useMemo(() => {
    const map = new Map<string, number>();
    (orders as Order[]).forEach((order) => {
      map.set(order.status, (map.get(order.status) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const topServices = useMemo(() => {
    const map = new Map<string, number>();
    (bookings as Booking[]).forEach((booking) => {
      const name = booking.service_name || 'Unknown Service';
      map.set(name, (map.get(name) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [bookings]);

  const monthlyPerformance = useMemo(() => {
    const bucket = new Map<
      string,
      { month: string; orders: number; bookings: number; paidRevenue: number }
    >();

    (orders as Order[]).forEach((order) => {
      const key = monthKey(order.created_at);
      const entry = bucket.get(key) || {
        month: key,
        orders: 0,
        bookings: 0,
        paidRevenue: 0,
      };
      entry.orders += 1;
      if (order.payment_status === 'paid') {
        entry.paidRevenue += Number(order.total || 0);
      }
      bucket.set(key, entry);
    });

    (bookings as Booking[]).forEach((booking) => {
      const key = monthKey(booking.created_at);
      const entry = bucket.get(key) || {
        month: key,
        orders: 0,
        bookings: 0,
        paidRevenue: 0,
      };
      entry.bookings += 1;
      if (booking.payment_status === 'paid') {
        entry.paidRevenue += Number(booking.total_price || 0);
      }
      bucket.set(key, entry);
    });

    return Array.from(bucket.values())
      .sort((a, b) => (a.month > b.month ? 1 : -1))
      .slice(-6);
  }, [orders, bookings]);

  const maxTopService = Math.max(...topServices.map((item) => item.count), 1);

  if (bookingsLoading || ordersLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6 py-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">
          Operational reports for bookings, orders and service demand.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookingStatusCounts.length === 0 ? (
              <p className="text-sm text-slate-500">
                No booking data available.
              </p>
            ) : (
              bookingStatusCounts.map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <span className="text-sm capitalize text-slate-700">
                    {status}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {count}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderStatusCounts.length === 0 ? (
              <p className="text-sm text-slate-500">No order data available.</p>
            ) : (
              orderStatusCounts.map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <span className="text-sm capitalize text-slate-700">
                    {status}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {count}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Services by Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topServices.length === 0 ? (
              <p className="text-sm text-slate-500">No services booked yet.</p>
            ) : (
              topServices.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="font-semibold text-slate-900">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 rounded bg-slate-100">
                    <div
                      className="h-2 rounded bg-indigo-500"
                      style={{
                        width: `${(item.count / maxTopService) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyPerformance.length === 0 ? (
              <p className="text-sm text-slate-500">
                No monthly data available.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2 pr-2">Month</th>
                      <th className="py-2 pr-2">Orders</th>
                      <th className="py-2 pr-2">Bookings</th>
                      <th className="py-2">Paid Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyPerformance.map((row) => (
                      <tr key={row.month} className="border-b">
                        <td className="py-2 pr-2 text-slate-700">
                          {monthLabel(row.month)}
                        </td>
                        <td className="py-2 pr-2 font-medium">{row.orders}</td>
                        <td className="py-2 pr-2 font-medium">
                          {row.bookings}
                        </td>
                        <td className="py-2 font-semibold">
                          R{row.paidRevenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
