import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import {
  Booking,
  BookingAssignmentStatus,
  BookingStatus,
  BookingPaymentStatus,
  AvailableWorker,
} from '@/lib/types/bookings';
// Inline BookingAssignment type for use in this file
type BookingAssignment = {
  worker_id: string;
  status: BookingAssignmentStatus;
  worker_name?: string;
  worker_email?: string;
};
import { MultiSelect } from '@/components/common/MultiSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUpdateBooking } from '@/lib/client/api/bookings/bookings.mutation';
import { getAvailableWorkersForBookingApi } from '@/lib/client/api/bookings/bookings.api';

// BookingEditModal function
export function BookingEditModal({
  open,
  booking,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  booking: Booking | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  // Use real mutation for backend update
  const updateBookingMutation = useUpdateBooking(booking?.id || '');
  const [savingSection, setSavingSection] = useState<'status' | 'assignments' | null>(null);
  // Fetch available workers for this booking
  const { data: workerData, isLoading: isWorkersLoading } = useQuery({
    queryKey: ['booking-available-workers', booking?.id],
    queryFn: () => getAvailableWorkersForBookingApi(String(booking?.id || '')),
    enabled: open && !!booking?.id,
    staleTime: 30 * 1000,
  });
  // Only store selected worker IDs for new assignments (not yet saved)
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  // Only store assignments that are already saved in DB
  const [assignments, setAssignments] = useState<BookingAssignment[]>([]);
  // Track last saved assignments for change detection
  const [lastSavedAssignments, setLastSavedAssignments] = useState<
    BookingAssignment[]
  >([]);
  // Form values type for booking status/payment status
  type BookingStatusFormValues = {
    status: BookingStatus;
    payment_status: BookingPaymentStatus;
  };
  // Separate form state for booking status and payment status only
  const {
    control,
    handleSubmit,
    reset,
  } = useForm<BookingStatusFormValues>({
    defaultValues: {
      status: booking ? booking.status : 'pending',
      payment_status: booking ? booking.payment_status : 'pending',
    },
  });
  useEffect(() => {
    if (open && booking) {
      const assigned = booking.assignments || [];
      setAssignments(assigned as BookingAssignment[]);
      setLastSavedAssignments(assigned as BookingAssignment[]);
      setSelectedWorkerIds([]);
      setSavingSection(null);
      reset({
        status: booking.status,
        payment_status: booking.payment_status,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking?.id]);
  // On submit, send booking status, payment status, and assignments (worker assignments with their statuses)
  // Save booking status/payment status only
  // Replace 'any' with BookingStatusFormValues or a more specific type if available
  const onSaveStatus = async (data: BookingStatusFormValues) => {
    if (!booking) return;
    const payload = {
      status: data.status,
      payment_status: data.payment_status,
    };
    setSavingSection('status');
    updateBookingMutation.mutate(payload, {
      onSuccess: () => {
        setSavingSection(null);
        onSuccess?.();
        onOpenChange(false);
      },
      onError: () => setSavingSection(null),
    });
  };

  if (!booking) return null;
  const workers: AvailableWorker[] = workerData?.workers || [];
  // Helper: compare assignments for changes

  // MultiSelect should only show workers who are NOT assigned yet
  const multiSelectOptions = (workerData?.workers || [])
    .filter(
      (w: AvailableWorker) =>
        !assignments.some(
          (a: BookingAssignment) => a.worker_id === w.worker_id,
        ),
    )
    .map((worker: AvailableWorker) => ({
      label: `${worker.full_name} • Rating: ${Number(worker.rating_avg || 0).toFixed(1)}`,
      value: worker.worker_id,
      disabled: false,
    }));
  // MultiSelect value is just selectedWorkerIds (not assigned yet)
  const multiSelectValue = selectedWorkerIds;

  // Helper: check if any assignment status has changed
  function assignmentsStatusChanged() {
    if (assignments.length !== lastSavedAssignments.length) return true;
    const sortById = (arr: BookingAssignment[]) =>
      [...arr].sort((a, b) => a.worker_id.localeCompare(b.worker_id));
    const a1 = sortById(assignments);
    const a2 = sortById(lastSavedAssignments);
    for (let i = 0; i < a1.length; i++) {
      if (a1[i].worker_id !== a2[i].worker_id || a1[i].status !== a2[i].status)
        return true;
    }
    return false;
  }

  const canSaveAssignments =
    selectedWorkerIds.length > 0 || assignmentsStatusChanged();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Booking</DialogTitle>
          <DialogDescription>
            Update booking status, payment and worker assignments
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Booking Status & Payment Status (admin only) */}
          <div className="flex flex-col gap-4 border p-3 rounded mb-4">
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
            <div className="flex justify-end mt-2">
              <Button
                type="button"
                onClick={() => handleSubmit(onSaveStatus)()}
                disabled={savingSection !== null}
              >
                {savingSection === 'status' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {savingSection === 'status' ? 'Saving...' : 'Save Status'}
              </Button>
            </div>
          </div>
          {/* Assign Workers and their statuses */}
          <div className="flex flex-col gap-2 border p-3 rounded mb-4">
            <Label>Assign Workers</Label>
            <div className="flex flex-col gap-2 mt-2">
              <MultiSelect
                options={multiSelectOptions}
                value={multiSelectValue}
                onChange={setSelectedWorkerIds}
                placeholder="Select workers"
                disabled={updateBookingMutation.isPending || isWorkersLoading}
              />
            </div>
            {/* Show only already assigned workers (from DB) */}
            {assignments.length > 0 && (
              <div className="mt-2 space-y-2">
                {assignments.map((a, idx) => {
                  const worker = workers.find(
                    (w) => w.worker_id === a.worker_id,
                  );
                  const displayName =
                    a.worker_name || worker?.full_name || a.worker_id;
                  const displayEmail = a.worker_email || '';
                  return (
                    <div
                      key={a.worker_id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex flex-col">
                        <span>{displayName}</span>
                        {displayEmail && (
                          <span className="ml-1 text-xs text-gray-500">
                            {displayEmail}
                          </span>
                        )}
                      </div>
                      <select
                        className="border rounded p-1 text-xs"
                        value={a.status}
                        onChange={(e) => {
                          const updated = assignments.map((as, i) =>
                            i === idx
                              ? {
                                  ...as,
                                  status: e.target
                                    .value as BookingAssignmentStatus,
                                }
                              : as,
                          );
                          setAssignments(updated as BookingAssignment[]);
                        }}
                        disabled={updateBookingMutation.isPending}
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end mt-2">
              <Button
                type="button"
                onClick={async () => {
                  if (!booking) return;
                  // Add new assignments for selectedWorkerIds
                  const newAssignments = [
                    ...assignments,
                    ...selectedWorkerIds.map((wid) => ({
                      worker_id: wid,
                      status: 'pending' as BookingAssignmentStatus,
                    })),
                  ];
                  const payload = {
                    assignments: newAssignments.map((a) => ({
                      worker_id: a.worker_id,
                      status: a.status,
                    })),
                  };
                  setSavingSection('assignments');
                  updateBookingMutation.mutate(payload, {
                    onSuccess: () => {
                      setSavingSection(null);
                      setLastSavedAssignments(
                        newAssignments as BookingAssignment[],
                      );
                      onSuccess?.();
                      onOpenChange(false);
                    },
                    onError: () => setSavingSection(null),
                  });
                }}
                disabled={savingSection !== null || !canSaveAssignments}
              >
                {savingSection === 'assignments' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {savingSection === 'assignments'
                  ? 'Saving...'
                  : 'Save Worker Assignments'}
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateBookingMutation.isPending}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
