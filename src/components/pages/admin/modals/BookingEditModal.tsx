'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
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
import { useUpdateBooking } from '@/lib/client/api/bookings/bookings.mutation';
import { getAvailableWorkersForBookingApi } from '@/lib/client/api/bookings/bookings.api';
import type {
  Booking,
  BookingAssignmentStatus,
  BookingPaymentStatus,
  BookingStatus,
  AvailableWorker,
} from '@/lib/types/bookings';

interface BookingEditModalProps {
  open: boolean;
  booking: Booking | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const bookingEditSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'assigned',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  payment_status: z.enum([
    'pending',
    'paid',
    'failed',
    'refunded',
    'cancelled',
  ]),
  assignment_status: z.enum([
    'pending',
    'accepted',
    'declined',
    'completed',
    'cancelled',
  ]),
  worker_id: z.string().optional(),
});

type BookingEditValues = z.infer<typeof bookingEditSchema>;

export function BookingEditModal({
  open,
  booking,
  onOpenChange,
  onSuccess,
}: BookingEditModalProps) {
  const updateBookingMutation = useUpdateBooking(booking?.id || '');

  const {
    data: workerData,
    isLoading: isWorkersLoading,
    refetch,
  } = useQuery({
    queryKey: ['booking-available-workers', booking?.id],
    queryFn: () => getAvailableWorkersForBookingApi(String(booking?.id || '')),
    enabled: open && !!booking?.id,
    staleTime: 30 * 1000,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<BookingEditValues>({
    resolver: zodResolver(bookingEditSchema),
    defaultValues: {
      status: booking?.status || 'pending',
      payment_status: booking?.payment_status || 'pending',
      assignment_status: booking?.assignment_status || 'pending',
      worker_id: undefined,
    },
  });

  useEffect(() => {
    if (booking) {
      const workerId = workerData?.assigned_worker_id || undefined;
      reset({
        status: booking.status,
        payment_status: booking.payment_status,
        assignment_status:
          (workerData?.assignment_status as BookingAssignmentStatus | null) ||
          booking.assignment_status ||
          'pending',
        worker_id: workerId,
      });
    }
  }, [
    booking,
    reset,
    workerData?.assigned_worker_id,
    workerData?.assignment_status,
  ]);

  const onSubmit = async (data: BookingEditValues) => {
    if (!booking) return;

    const currentAssignedWorkerId =
      workerData?.assigned_worker_id || booking.assigned_worker_id || null;
    const currentAssignmentStatus =
      (workerData?.assignment_status as BookingAssignmentStatus | null) ||
      booking.assignment_status ||
      'pending';
    const nextWorkerId = data.worker_id || null;

    const payload: {
      status?: BookingStatus;
      payment_status?: BookingPaymentStatus;
      assignment_status?: BookingAssignmentStatus;
      worker_id?: string | null;
    } = {};

    if (data.status !== booking.status) {
      payload.status = data.status;
    }

    if (data.payment_status !== booking.payment_status) {
      payload.payment_status = data.payment_status;
    }

    if (data.assignment_status !== currentAssignmentStatus) {
      payload.assignment_status = data.assignment_status;
    }

    if (nextWorkerId !== currentAssignedWorkerId) {
      payload.worker_id = nextWorkerId;
    }

    if (Object.keys(payload).length === 0) {
      onOpenChange(false);
      return;
    }

    updateBookingMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  const handleAutoAssign = () => {
    if (!booking) return;

    updateBookingMutation.mutate(
      {
        auto_assign: true,
      },
      {
        onSuccess: async () => {
          await refetch();
          onSuccess?.();
        },
      },
    );
  };

  if (!booking) return null;

  const workers: AvailableWorker[] = workerData?.workers || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Booking</DialogTitle>
          <DialogDescription>
            Update booking status, payment and worker assignment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="booking-status">Booking Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as BookingStatus)
                  }
                  disabled={updateBookingMutation.isPending}
                >
                  <SelectTrigger id="booking-status" className="mt-2">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="payment-status">Payment Status</Label>
            <Controller
              name="payment_status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as BookingPaymentStatus)
                  }
                  disabled={updateBookingMutation.isPending}
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
              )}
            />
          </div>

          <div>
            <Label htmlFor="assignment-status">Assignment Status</Label>
            <Controller
              name="assignment_status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as BookingAssignmentStatus)
                  }
                  disabled={updateBookingMutation.isPending}
                >
                  <SelectTrigger id="assignment-status" className="mt-2">
                    <SelectValue placeholder="Select assignment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="worker-id">Assign Worker</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoAssign}
                disabled={updateBookingMutation.isPending || isWorkersLoading}
              >
                Auto Assign Best
              </Button>
            </div>

            <Controller
              name="worker_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || 'none'}
                  onValueChange={(value) =>
                    field.onChange(value === 'none' ? undefined : value)
                  }
                  disabled={updateBookingMutation.isPending || isWorkersLoading}
                >
                  <SelectTrigger id="worker-id" className="mt-2">
                    <SelectValue
                      placeholder={
                        isWorkersLoading
                          ? 'Loading available workers...'
                          : workers.length > 0
                            ? 'Select available worker'
                            : 'No available workers'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No assignment</SelectItem>
                    {workers.map((worker) => (
                      <SelectItem
                        key={worker.worker_id}
                        value={worker.worker_id}
                      >
                        {worker.full_name} • Rating:{' '}
                        {Number(worker.rating_avg || 0).toFixed(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateBookingMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateBookingMutation.isPending || !isDirty}
            >
              {updateBookingMutation.isPending
                ? 'Updating...'
                : 'Update Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
