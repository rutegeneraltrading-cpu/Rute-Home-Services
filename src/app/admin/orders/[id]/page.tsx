'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  MapPin,
  Package,
  Phone,
  User,
} from 'lucide-react';
import { useGetOrder } from '@/lib/client/api/orders/orders.query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Loading } from '@/components/common';

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const paymentStatusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

const SingleOrderPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params?.id;

  const { data: order, isLoading, isError } = useGetOrder(orderId || '');

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (isError || !order) {
    return (
      <div className="py-10 space-y-6">
        <Button variant="outline" onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-slate-600">
            Order not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const detailedItems = order.detailed_items || [];

  return (
    <div className="py-10 space-y-6">
      <div className="flex md:flex-row flex-col md:items-center items-start md:justify-between gap-4">
        <Button variant="outline" onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <div className="md:text-right">
          <h1 className="text-2xl font-bold text-slate-900">Order Details</h1>
          <p className="text-sm text-slate-500 font-mono">#{order.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products ({detailedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {detailedItems.length === 0 ? (
              <p className="text-sm text-slate-500">No items found.</p>
            ) : (
              detailedItems.map((item, idx) => {
                const primaryImage =
                  item.product?.images?.find((img) => img?.is_primary)?.url ||
                  item.product?.images?.[0]?.url;

                return (
                  <div
                    key={`${item.product_id}-${idx}`}
                    className="md:border rounded-lg md:p-4 md:bg-slate-50"
                  >
                    <div className="flex md:flex-row flex-col md:items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 rounded-md overflow-hidden bg-white border shrink-0">
                          {primaryImage ? (
                            <Image
                              src={primaryImage}
                              alt={item.product?.name || 'Product image'}
                              width={56}
                              height={56}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-400">
                              No Image
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Product ID: {item.product_id}
                          </p>
                          {item.product?.sku && (
                            <p className="text-xs text-slate-500">
                              SKU: {item.product.sku}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-sm">
                        <p>
                          Qty:{' '}
                          <span className="font-semibold">{item.quantity}</span>
                        </p>
                        <p>
                          Unit:{' '}
                          <span className="font-semibold">
                            R{Number(item.price).toFixed(2)}
                          </span>
                        </p>
                        <p className="font-bold text-slate-900 mt-1">
                          Line Total: R{Number(item.line_total).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColor[order.status] || 'bg-gray-100 text-gray-700'}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Payment</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${paymentStatusColor[order.payment_status] || 'bg-gray-100 text-gray-700'}`}
                >
                  {order.payment_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span>R{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tax</span>
                <span>R{Number(order.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Shipping</span>
                <span>R{Number(order.shipping).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total</span>
                <span>R{Number(order.total).toFixed(2)}</span>
              </div>
              {order.payfast_transaction_id && (
                <div className="pt-2 border-t text-xs text-slate-600 flex items-start gap-2">
                  <CreditCard className="h-4 w-4 mt-0.5" />
                  <span>PayFast TXN: {order.payfast_transaction_id}</span>
                </div>
              )}
              <div className="text-xs text-slate-600 flex items-start gap-2">
                <CalendarDays className="h-4 w-4 mt-0.5" />
                <span>{new Date(order.created_at).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold text-slate-900">
                {order.profile?.full_name || 'N/A'}
              </p>
              <p className="text-slate-600">{order.profile?.email || 'N/A'}</p>
              {order.profile?.phone && (
                <p className="text-slate-600 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {order.profile.phone}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-slate-700">
              <p>
                {order.address?.recipient_name ||
                  order.profile?.full_name ||
                  'N/A'}
              </p>
              {order.address?.phone && <p>{order.address.phone}</p>}
              <p>{order.address?.line1 || 'N/A'}</p>
              {order.address?.line2 && <p>{order.address.line2}</p>}
              <p>
                {[order.address?.city, order.address?.state_province]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p>
                {[order.address?.postal_code, order.address?.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            {order.notes}
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-slate-500">
        Need to edit status/payment? Go back to{' '}
        <Link href="/admin/orders" className="underline">
          Orders List
        </Link>
        .
      </div>
    </div>
  );
};

export default SingleOrderPage;
