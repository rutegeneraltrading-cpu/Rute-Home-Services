'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';
import { ContactMessage, useUpdateContactMessage } from '@/lib/client/api';
import { z } from 'zod';

const contactStatusSchema = z.object({
  status: z.enum(['new', 'read', 'resolved']),
});

type ContactStatusValues = z.infer<typeof contactStatusSchema>;

interface ContactEditModalProps {
  open: boolean;
  contact: ContactMessage | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ContactEditModal({
  open,
  contact,
  onOpenChange,
  onSuccess,
}: ContactEditModalProps) {
  const updateContactMutation = useUpdateContactMessage(contact?.id || '');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isDirty, errors },
  } = useForm<ContactStatusValues>({
    resolver: zodResolver(contactStatusSchema),
    defaultValues: {
      status: 'new',
    },
  });

  useEffect(() => {
    if (contact) {
      reset({ status: contact.status || 'new' });
    }
  }, [contact, reset]);

  const onSubmit = (data: ContactStatusValues) => {
    if (!contact) return;
    updateContactMutation.mutate(
      { status: data.status },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
      },
    );
  };

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Contact Message</DialogTitle>
          <DialogDescription>
            Update the status for this contact request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium text-foreground">{contact.name}</p>
            <p className="text-muted-foreground">{contact.email}</p>
            {contact.phone && (
              <p className="text-muted-foreground">{contact.phone}</p>
            )}
            <p className="mt-2 text-sm text-foreground">
              <span className="font-semibold">Subject:</span> {contact.subject}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {contact.message}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setValue(
                        'status',
                        value as ContactStatusValues['status'],
                        {
                          shouldDirty: true,
                        },
                      );
                    }}
                  >
                    <SelectTrigger id="status" className="mt-2">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateContactMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateContactMutation.isPending || !isDirty}
              >
                {updateContactMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
