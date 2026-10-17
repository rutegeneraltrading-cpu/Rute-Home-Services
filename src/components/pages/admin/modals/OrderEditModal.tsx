'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useUpdateOrder } from '@/lib/client/api/orders/orders.mutation';
import type {
  Order,
  OrderStatus,
  OrderPaymentStatus,
} from '@/lib/types/orders';

interface OrderEditModalProps {
  open: boolean;
  order: Order | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const orderEditSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ]),
  payment_status: z.enum([
    'pending',
    'paid',
    'failed',
    'refunded',
    'cancelled',
  ]),
});

type OrderEditValues = z.infer<typeof orderEditSchema>;

export function OrderEditModal({
  open,
  order,
  onOpenChange,
  onSuccess,
}: OrderEditModalProps) {
  const updateOrderMutation = useUpdateOrder(order?.id || '');

  // Only asked for when payment status is being set to 'refunded'.
  // Pre-filled with the full total — editable down for a partial refund.
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  const {
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<OrderEditValues>({
    resolver: zodResolver(orderEditSchema),
    defaultValues: {
      status: order?.status || 'pending',
      payment_status: order?.payment_status || 'pending',
    },
  });

  useEffect(() => {
    if (order) {
      reset({
        status: order.status,
        payment_status: order.payment_status,
      });
      setRefundReason('');
      setRefundAmount(order.total != null ? String(order.total) : '');
    }
  }, [order, reset]);

  const onSubmit = async (data: OrderEditValues) => {
    if (!order) return;

    const payload = {
      ...data,
      ...(data.payment_status === 'refunded'
        ? {
            refund_reason: refundReason.trim() || undefined,
            refund_amount:
              refundAmount.trim() && !Number.isNaN(Number(refundAmount))
                ? Number(refundAmount)
                : undefined,
          }
        : {}),
    };

    updateOrderMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Update order and payment status for order #{order.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="order-status">Order Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(value) =>
                setValue('status', value as OrderStatus, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="order-status" className="mt-2">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payment-status">Payment Status</Label>
            <Select
              value={watch('payment_status')}
              onValueChange={(value) =>
                setValue('payment_status', value as OrderPaymentStatus, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="payment-status" className="mt-2">
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {watch('payment_status') === 'refunded' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="order-refund-amount">Refund amount (R)</Label>
                <input
                  id="order-refund-amount"
                  type="number"
                  min={0}
                  max={order.total}
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Defaults to the full R{Number(order.total).toFixed(2)} —
                  lower it for a partial refund.
                </p>
              </div>
              <div>
                <Label htmlFor="order-refund-reason">Refund reason</Label>
                <textarea
                  id="order-refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={2}
                  placeholder="Why is this order being refunded?"
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Recorded on the order and emailed to the customer.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateOrderMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateOrderMutation.isPending || !isDirty}
            >
              {updateOrderMutation.isPending ? 'Updating...' : 'Update Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
