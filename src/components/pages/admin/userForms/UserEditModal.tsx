'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from '@/components/ui/select';
import { User } from '@/lib/types';
import { useUpdateUser } from '@/lib/client/api';
import { userEditSchema, UserEditValues } from '@/lib/validations';

interface UserEditModalProps {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UserEditModal({
  open,
  user,
  onOpenChange,
  onSuccess,
}: UserEditModalProps) {
  const updateUserMutation = useUpdateUser(user?.id || '', {
    onSuccess: () => {
      toast.success('User updated successfully');
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UserEditValues>({
    resolver: zodResolver(userEditSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || user.name || '',
        status:
          (user.status as 'active' | 'inactive' | 'suspended') || 'active',
      });
    }
  }, [user, reset]);

  const onSubmit = (data: UserEditValues) => {
    if (!user) return;
    updateUserMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Email cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="mt-2 bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <Label htmlFor="full_name">Name *</Label>
            <Input
              id="full_name"
              {...register('full_name')}
              className="mt-2"
              placeholder="Enter user name"
            />
            {errors.full_name && (
              <p className="text-sm text-red-500 mt-1">
                {errors.full_name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="status">Status *</Label>
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
                      value as 'active' | 'inactive' | 'suspended',
                      { shouldDirty: true },
                    );
                  }}
                >
                  <SelectTrigger id="status" className="mt-2">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
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
              disabled={updateUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateUserMutation.isPending || !isDirty}
            >
              {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
