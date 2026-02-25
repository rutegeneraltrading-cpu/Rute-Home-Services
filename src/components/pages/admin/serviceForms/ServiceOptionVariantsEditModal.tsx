import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type {
  ServiceOptionVariant,
  UpdateServiceOptionVariantDTO,
} from '@/lib/types/admin/services';
import { useUpdateServiceOptionVariant } from '@/lib/client/api';

interface ServiceOptionVariantsEditModalProps {
  open: boolean;
  variant: ServiceOptionVariant | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ServiceOptionVariantsEditModal({
  open,
  variant,
  onOpenChange,
}: ServiceOptionVariantsEditModalProps) {
  const [form, setForm] = useState<Partial<UpdateServiceOptionVariantDTO>>({});
  const updateVariantMutation = useUpdateServiceOptionVariant(
    variant?.id || '',
  );

  React.useEffect(() => {
    if (variant) {
      setForm({
        name: variant.name,
        type: variant.type,
        price: variant.price,
        duration_minutes: variant.duration_minutes,
        display_order: variant.display_order,
        is_active: variant.is_active,
      });
    } else {
      setForm({});
    }
  }, [variant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant) return;
    updateVariantMutation.mutate(form as UpdateServiceOptionVariantDTO, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!variant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Variant</DialogTitle>
          <DialogDescription>
            Update the selected service option variant details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="variant-name">Variant Name *</Label>
            <Input
              id="variant-name"
              value={form.name || ''}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              disabled={updateVariantMutation.isPending}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="variant-type">Type</Label>
            <Input
              id="variant-type"
              value={form.type || ''}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              disabled={updateVariantMutation.isPending}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="variant-price">Price (ZAR)</Label>
            <Input
              id="variant-price"
              type="number"
              value={form.price ?? 0}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: Number(e.target.value) }))
              }
              required
              disabled={updateVariantMutation.isPending}
              className="mt-2"
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="variant-duration">Duration (minutes)</Label>
            <Input
              id="variant-duration"
              type="number"
              value={form.duration_minutes ?? 0}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  duration_minutes: Number(e.target.value),
                }))
              }
              required
              disabled={updateVariantMutation.isPending}
              className="mt-2"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="variant-display-order">Display Order</Label>
            <Input
              id="variant-display-order"
              type="number"
              value={form.display_order ?? 0}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  display_order: Number(e.target.value),
                }))
              }
              disabled={updateVariantMutation.isPending}
              className="mt-2"
              placeholder="0"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="variant-is-active"
              type="checkbox"
              checked={form.is_active !== false}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="w-4 h-4 rounded"
              disabled={updateVariantMutation.isPending}
            />
            <Label htmlFor="variant-is-active">Active</Label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateVariantMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateVariantMutation.isPending}>
              {updateVariantMutation.isPending
                ? 'Updating...'
                : 'Update Variant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
