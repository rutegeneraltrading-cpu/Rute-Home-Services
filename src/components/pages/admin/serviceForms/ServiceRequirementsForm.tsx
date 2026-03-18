import { useState, useMemo } from 'react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { useGetCategories, useGetServices } from '@/lib/client/api';

import { useCreateServiceRequirement } from '@/lib/client/api/services/services.mutation';

const REQUIREMENT_TYPE_OPTIONS = [
  { value: 'size', label: 'Size' },
  { value: 'property_size', label: 'Property Size' },
  { value: 'truck_size', label: 'Truck Size' },
  { value: 'assistants', label: 'Assistants' },
  { value: 'type', label: 'Type' },
] as const;

type Requirement = {
  name: string;
  type: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  display_order: number;
};

export function ServiceRequirementsForm() {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const initialRequirement: Requirement = {
    name: '',
    type: '',
    price: 0,
    duration_minutes: 0,
    is_active: true,
    display_order: 0,
  };
  const [requirement, setRequirement] =
    useState<Requirement>(initialRequirement);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const { data: allServices, isLoading: servicesLoading } = useGetServices();

  const createRequirementMutation = useCreateServiceRequirement();
  const filteredServices = useMemo(
    () =>
      Array.isArray(allServices)
        ? allServices.filter(
            (s: { category_id: string }) =>
              s.category_id === selectedCategoryId,
          )
        : [],
    [allServices, selectedCategoryId],
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Select Service Category</CardTitle>
          <CardDescription>
            Choose which category the service belongs to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Service Category *</Label>
          <Select
            value={selectedCategoryId}
            onValueChange={(val) => {
              setSelectedCategoryId(val);
              setSelectedServiceId('');
            }}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categoriesLoading ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : categories?.categories?.length ? (
                categories.categories.map(
                  (category: { id: string; name: string }) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ),
                )
              ) : (
                <SelectItem value="none" disabled>
                  No categories available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {selectedCategoryId && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Select Service</CardTitle>
            <CardDescription>
              Choose which service to add requirements to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label>Service *</Label>
            <Select
              value={selectedServiceId}
              onValueChange={setSelectedServiceId}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {servicesLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : filteredServices.length ? (
                  filteredServices.map(
                    (service: { id: string; name: string }) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ),
                  )
                ) : (
                  <SelectItem value="none" disabled>
                    No services in this category
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Show requirement form only if category and service are selected */}
      {selectedCategoryId && selectedServiceId && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Add Requirement</CardTitle>
            <CardDescription>
              Add a new requirement for this service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                try {
                  await createRequirementMutation.mutateAsync({
                    ...requirement,
                    service_id: selectedServiceId,
                  });
                  setRequirement(initialRequirement);
                  setDirty(false);
                } catch (err) {
                  // Optionally handle error
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-6"
            >
              <div>
                <Label htmlFor="requirement_name">Requirement Name *</Label>
                <Input
                  id="requirement_name"
                  value={requirement.name}
                  onChange={(e) => {
                    setRequirement((v) => ({ ...v, name: e.target.value }));
                    setDirty(true);
                  }}
                  required
                  className="mt-2"
                  disabled={submitting}
                  placeholder="e.g. Studio, 2-Bed, Small Truck"
                />
              </div>
              <div>
                <Label htmlFor="requirement_type">Type *</Label>
                <Select
                  value={requirement.type}
                  onValueChange={(value) => {
                    setRequirement((v) => ({ ...v, type: value }));
                    setDirty(true);
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger id="requirement_type" className="mt-2">
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
                <Label htmlFor="requirement_price">Price (ZAR)</Label>
                <Input
                  id="requirement_price"
                  type="number"
                  value={requirement.price}
                  onChange={(e) => {
                    setRequirement((v) => ({
                      ...v,
                      price: parseFloat(e.target.value) || 0,
                    }));
                    setDirty(true);
                  }}
                  className="mt-2"
                  disabled={submitting}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="requirement_duration">Duration (minutes)</Label>
                <Input
                  id="requirement_duration"
                  type="number"
                  value={requirement.duration_minutes}
                  onChange={(e) => {
                    setRequirement((v) => ({
                      ...v,
                      duration_minutes: parseInt(e.target.value) || 0,
                    }));
                    setDirty(true);
                  }}
                  className="mt-2"
                  disabled={submitting}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="requirement_display_order">Display Order</Label>
                <Input
                  id="requirement_display_order"
                  type="number"
                  value={requirement.display_order}
                  onChange={(e) => {
                    setRequirement((v) => ({
                      ...v,
                      display_order: parseInt(e.target.value) || 0,
                    }));
                    setDirty(true);
                  }}
                  className="mt-2"
                  disabled={submitting}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="requirement_is_active"
                  type="checkbox"
                  checked={requirement.is_active}
                  onChange={(e) =>
                    setRequirement((v) => ({
                      ...v,
                      is_active: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded"
                  disabled={submitting}
                />
                <Label htmlFor="requirement_is_active">Active</Label>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t">
                {dirty && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRequirement(initialRequirement);
                      setDirty(false);
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={submitting || !dirty || !requirement.type}
                >
                  {submitting ? 'Adding...' : 'Add Requirement'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Backward-compatible export
export const ServiceVariantsForm = ServiceRequirementsForm;
