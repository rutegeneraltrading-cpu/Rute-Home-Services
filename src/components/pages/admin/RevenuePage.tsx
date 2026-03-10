'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Loading } from '@/components/common';
import { useGetOrders } from '@/lib/client/api/orders/orders.query';
import { useGetBookings } from '@/lib/client/api/bookings/bookings.query';
import type { Order } from '@/lib/types/orders';
import type { Booking } from '@/lib/types/bookings';

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

const RevenuePage = () => {
  const { data: orders = [], isLoading: ordersLoading } = useGetOrders();
  const { data: bookings = [], isLoading: bookingsLoading } = useGetBookings();

  const paidOrders = useMemo(
    () =>
      (orders as Order[]).filter((order) => order.payment_status === 'paid'),
    [orders],
  );
  const paidBookings = useMemo(
    () =>
      (bookings as Booking[]).filter(
        (booking) => booking.payment_status === 'paid',
      ),
    [bookings],
  );

  const orderRevenue = useMemo(
    () => paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [paidOrders],
  );
  const bookingRevenue = useMemo(
    () =>
      paidBookings.reduce(
        (sum, booking) => sum + Number(booking.total_price || 0),
        0,
      ),
    [paidBookings],
  );

  const totalRevenue = orderRevenue + bookingRevenue;

  const paymentSuccessRate = useMemo(() => {
    const orderSuccess = orders.length
      ? (paidOrders.length / orders.length) * 100
      : 0;
    const bookingSuccess = bookings.length
      ? (paidBookings.length / bookings.length) * 100
      : 0;

    return {
      orders: orderSuccess,
      bookings: bookingSuccess,
    };
  }, [orders, bookings, paidOrders, paidBookings]);

  const monthlyRevenue = useMemo(() => {
    const bucket = new Map<
      string,
      { month: string; order: number; booking: number }
    >();

    paidOrders.forEach((order) => {
      const key = monthKey(order.created_at);
      const entry = bucket.get(key) || { month: key, order: 0, booking: 0 };
      entry.order += Number(order.total || 0);
      bucket.set(key, entry);
    });

    paidBookings.forEach((booking) => {
      const key = monthKey(booking.created_at);
      const entry = bucket.get(key) || { month: key, order: 0, booking: 0 };
      entry.booking += Number(booking.total_price || 0);
      bucket.set(key, entry);
    });

    return Array.from(bucket.values())
      .sort((a, b) => (a.month > b.month ? 1 : -1))
      .slice(-6);
  }, [paidOrders, paidBookings]);

  const maxMonthlyRevenue = Math.max(
    ...monthlyRevenue.map((row) => row.order + row.booking),
    1,
  );

  if (ordersLoading || bookingsLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6 py-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Revenue</h1>
        <p className="text-gray-600 mt-1">
          Revenue analytics from paid bookings and paid orders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900">
              R{totalRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Order Revenue</p>
            <p className="text-2xl font-bold text-slate-900">
              R{orderRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Booking Revenue</p>
            <p className="text-2xl font-bold text-slate-900">
              R{bookingRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Paid Transactions</p>
            <p className="text-2xl font-bold text-slate-900">
              {paidOrders.length + paidBookings.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Orders</span>
                <span className="font-semibold">
                  R{orderRevenue.toFixed(2)}
                </span>
              </div>
              <div className="h-2 rounded bg-slate-100">
                <div
                  className="h-2 rounded bg-indigo-500"
                  style={{
                    width: `${totalRevenue ? (orderRevenue / totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Bookings</span>
                <span className="font-semibold">
                  R{bookingRevenue.toFixed(2)}
                </span>
              </div>
              <div className="h-2 rounded bg-slate-100">
                <div
                  className="h-2 rounded bg-emerald-500"
                  style={{
                    width: `${totalRevenue ? (bookingRevenue / totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Success Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Orders</span>
                <span className="font-semibold">
                  {paymentSuccessRate.orders.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded bg-slate-100">
                <div
                  className="h-2 rounded bg-blue-500"
                  style={{ width: `${paymentSuccessRate.orders}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Bookings</span>
                <span className="font-semibold">
                  {paymentSuccessRate.bookings.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded bg-slate-100">
                <div
                  className="h-2 rounded bg-purple-500"
                  style={{ width: `${paymentSuccessRate.bookings}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.length === 0 ? (
            <p className="text-sm text-slate-500">No revenue data available.</p>
          ) : (
            <div className="space-y-4">
              {monthlyRevenue.map((row) => {
                const total = row.order + row.booking;

                return (
                  <div key={row.month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">
                        {monthLabel(row.month)}
                      </span>
                      <span className="font-semibold text-slate-900">
                        R{total.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 rounded bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 bg-indigo-500"
                        style={{
                          width: `${(total / maxMonthlyRevenue) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Orders: R{row.order.toFixed(2)} • Bookings: R
                      {row.booking.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenuePage;
