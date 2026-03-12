'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ClipboardList,
  Package,
  ReceiptText,
  ShoppingBag,
  Wrench,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Loading } from '@/components/common';
import { useGetProfile } from '@/lib/client/api/profile/profile.query';
import { useGetBookings } from '@/lib/client/api/bookings/bookings.query';
import { useGetOrders } from '@/lib/client/api/orders/orders.query';
import { useGetProducts } from '@/lib/client/api/products/products.query';
import type { Booking } from '@/lib/types/bookings';
import type { Order } from '@/lib/types/orders';

type PublicService = {
  id: string;
  name: string;
  slug: string;
  base_price?: number;
};

const DashboardPage = () => {
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: bookings = [], isLoading: bookingsLoading } = useGetBookings();
  const { data: orders = [], isLoading: ordersLoading } = useGetOrders();
  const { data: products = [], isLoading: productsLoading } = useGetProducts();

  const { data: services = [], isLoading: servicesLoading } = useQuery<
    PublicService[]
  >({
    queryKey: ['public-dashboard-services'],
    queryFn: async () => {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      return data?.services || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const fullName = profile?.full_name || 'User';
  const firstName = fullName.split(' ')[0] || 'User';

  const activeBookings = useMemo(
    () =>
      (bookings as Booking[]).filter(
        (booking) => booking.payment_status === 'paid',
      ).length,
    [bookings],
  );

  const paidBookings = useMemo(
    () =>
      (bookings as Booking[]).filter(
        (booking) => booking.payment_status === 'paid',
      ),
    [bookings],
  );

  const paidOrders = useMemo(
    () =>
      (orders as Order[]).filter((order) => order.payment_status === 'paid'),
    [orders],
  );

  const totalSpent = useMemo(() => {
    const bookingTotal = paidBookings.reduce(
      (sum, booking) => sum + Number(booking.total_price || 0),
      0,
    );
    const orderTotal = paidOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );

    return bookingTotal + orderTotal;
  }, [paidBookings, paidOrders]);

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

  const featuredServices = useMemo(() => [...services].slice(0, 4), [services]);

  const featuredProducts = useMemo(() => [...products].slice(0, 4), [products]);

  if (profileLoading || bookingsLoading || ordersLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6 py-10">
      <div className="flex md:flex-row flex-col items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {firstName}
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s a quick summary of your bookings, orders and payments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/services">Book a Service</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shop">Shop Products</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Bookings</p>
                <p className="text-2xl font-bold text-slate-900">
                  {bookings.length}
                </p>
              </div>
              <CalendarDays className="h-5 w-5 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Bookings</p>
                <p className="text-2xl font-bold text-slate-900">
                  {activeBookings}
                </p>
              </div>
              <ClipboardList className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900">
                  {orders.length}
                </p>
              </div>
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="text-2xl font-bold text-slate-900">
                  R{totalSpent.toFixed(2)}
                </p>
              </div>
              <ReceiptText className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/user/bookings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-slate-500">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/user/bookings/${booking.id}`}
                    className="block rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {booking.service_name || 'Service'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.booking_date} • {booking.booking_time}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        R{Number(booking.total_price || 0).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/user/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-500">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/user/orders/${order.id}`}
                    className="block rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(order.created_at).toLocaleDateString()} •{' '}
                          {Array.isArray(order.items) ? order.items.length : 0}{' '}
                          items
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        R{Number(order.total || 0).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Discover Services
            </CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/services">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {servicesLoading ? (
              <p className="text-sm text-slate-500">Loading services...</p>
            ) : featuredServices.length === 0 ? (
              <p className="text-sm text-slate-500">
                No services available now.
              </p>
            ) : (
              <div className="space-y-2">
                {featuredServices.map((service) => (
                  <Link
                    key={service.id}
                    href={`/booking?service=${service.slug}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {service.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {typeof service.base_price === 'number'
                        ? `R${service.base_price}`
                        : 'Price on request'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Trending Products
            </CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/shop">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <p className="text-sm text-slate-500">Loading products...</p>
            ) : featuredProducts.length === 0 ? (
              <p className="text-sm text-slate-500">
                No products available now.
              </p>
            ) : (
              <div className="space-y-2">
                {featuredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/shop/${product.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      R
                      {Number(product.sale_price || product.price || 0).toFixed(
                        2,
                      )}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
