import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type {
  ServiceRequirement,
  UpdateServiceRequirementDTO,
} from '@/lib/types/admin/services';
import { useUpdateServiceRequirement } from '@/lib/client/api';

const REQUIREMENT_TYPE_OPTIONS = [
  { value: 'size', label: 'Size' },
  { value: 'property_size', label: 'Property Size' },
  { value: 'truck_size', label: 'Truck Size' },
  { value: 'type', label: 'Type' },
] as const;

interface ServiceRequirementEditModalProps {
  open: boolean;
  requirement: ServiceRequirement | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ServiceRequirementEditModal({
  open,
  requirement,
  onOpenChange,
}: ServiceRequirementEditModalProps) {
  const [form, setForm] = useState<Partial<UpdateServiceRequirementDTO>>({});
  const updateRequirementMutation = useUpdateServiceRequirement(
    requirement?.id || '',
  );

  React.useEffect(() => {
    if (requirement) {
      setForm({
        name: requirement.name,
        type: requirement.type,
        price: requirement.price,
        duration_minutes: requirement.duration_minutes,
        display_order: requirement.display_order,
        is_active: requirement.is_active,
      });
    } else {
      setForm({});
    }
  }, [requirement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirement) return;
    updateRequirementMutation.mutate(form as UpdateServiceRequirementDTO, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!requirement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Requirement</DialogTitle>
          <DialogDescription>
            Update the selected service requirement details.
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
              disabled={updateRequirementMutation.isPending}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="variant-type">Type *</Label>
            <Select
              value={form.type || ''}
              onValueChange={(value) => setForm((f) => ({ ...f, type: value }))}
              disabled={updateRequirementMutation.isPending}
            >
              <SelectTrigger id="variant-type" className="mt-2">
                <SelectValue placeholder="Select requirement type" />
              </SelectTrigger>
              <SelectContent>
                {REQUIREMENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={updateRequirementMutation.isPending}
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
              disabled={updateRequirementMutation.isPending}
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
              disabled={updateRequirementMutation.isPending}
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
              disabled={updateRequirementMutation.isPending}
            />
            <Label htmlFor="variant-is-active">Active</Label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateRequirementMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateRequirementMutation.isPending || !form.type}
            >
              {updateRequirementMutation.isPending
                ? 'Updating...'
                : 'Update Requirement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Backward-compatible export
export const ServiceOptionVariantsEditModal = ServiceRequirementEditModal;
