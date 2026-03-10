'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Activity,
  CalendarDays,
  Package,
  ReceiptText,
  Wrench,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from '@/components/ui';
import { Loading } from '@/components/common';
import { useGetOrders } from '@/lib/client/api/orders/orders.query';
import { useGetBookings } from '@/lib/client/api/bookings/bookings.query';
import { useGetProducts } from '@/lib/client/api/products/products.query';
import { useGetServices } from '@/lib/client/api/services/services.query';
import type { Order } from '@/lib/types/orders';
import type { Booking } from '@/lib/types/bookings';

interface DashboardPageProps {
  pageTitle?: string;
  pageDescription?: string;
}

export default function DashboardPage({
  pageTitle = 'Dashboard',
  pageDescription = 'Welcome back! Here&apos;s your business overview.',
}: DashboardPageProps) {
  const { data: orders = [], isLoading: ordersLoading } = useGetOrders();
  const { data: bookings = [], isLoading: bookingsLoading } = useGetBookings();
  const { data: products = [], isLoading: productsLoading } = useGetProducts();
  const { data: services = [], isLoading: servicesLoading } = useGetServices();

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

  const totalRevenue = useMemo(() => {
    const orderRevenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );
    const bookingRevenue = paidBookings.reduce(
      (sum, booking) => sum + Number(booking.total_price || 0),
      0,
    );
    return orderRevenue + bookingRevenue;
  }, [paidOrders, paidBookings]);

  const pendingPayments = useMemo(() => {
    const orderPending = (orders as Order[]).filter(
      (order) => order.payment_status === 'pending',
    ).length;
    const bookingPending = (bookings as Booking[]).filter(
      (booking) => booking.payment_status === 'pending',
    ).length;

    return orderPending + bookingPending;
  }, [orders, bookings]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.stock || 0) <= 10).length,
    [products],
  );

  const recentOrders = useMemo(
    () =>
      [...(orders as Order[])]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5),
    [orders],
  );

  const recentBookings = useMemo(
    () =>
      [...(bookings as Booking[])]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5),
    [bookings],
  );

  if (ordersLoading || bookingsLoading || productsLoading || servicesLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Revenue (Paid)</p>
              <p className="text-2xl font-bold">R{totalRevenue.toFixed(2)}</p>
            </div>
            <ReceiptText className="h-5 w-5 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
            <Package className="h-5 w-5 text-indigo-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Bookings</p>
              <p className="text-2xl font-bold">{bookings.length}</p>
            </div>
            <CalendarDays className="h-5 w-5 text-purple-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending Payments</p>
              <p className="text-2xl font-bold">{pendingPayments}</p>
            </div>
            <Activity className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-500">No orders yet.</p>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block rounded-lg border p-3 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {order.status}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      R{Number(order.total || 0).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/bookings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-slate-500">No bookings yet.</p>
            ) : (
              recentBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="block rounded-lg border p-3 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {booking.service_name || 'Service'}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {booking.status}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      R{Number(booking.total_price || 0).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Products</p>
            <p className="text-2xl font-bold text-slate-900">
              {products.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Low stock (≤10): {lowStockProducts}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Services</p>
            <p className="text-2xl font-bold text-slate-900">
              {services.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Active in catalog overview
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Quick Links</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/reports">Reports</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/revenue">Revenue</Link>
                </Button>
              </div>
            </div>
            <Wrench className="h-5 w-5 text-slate-500" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
