'use client';

import { useEffect } from 'react';
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
    }
  }, [order, reset]);

  const onSubmit = async (data: OrderEditValues) => {
    if (!order) return;

    updateOrderMutation.mutate(data, {
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
