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

import {
  useGetCategories,
  useGetServices,
  useGetServiceOptions,
} from '@/lib/client/api';

import { useCreateServiceOptionVariant } from '@/lib/client/api/services/services.mutation';
type Variant = {
  name: string;
  type: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  display_order: number;
};

export function ServiceVariantsForm() {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const initialVariant: Variant = {
    name: '',
    type: '',
    price: 0,
    duration_minutes: 0,
    is_active: true,
    display_order: 0,
  };
  const [variant, setVariant] = useState<Variant>(initialVariant);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const { data: allServices, isLoading: servicesLoading } = useGetServices();
  const { data: options, isLoading: optionsLoading } =
    useGetServiceOptions(selectedServiceId);

  // Removed success state, use mutation status instead
  const createVariantMutation = useCreateServiceOptionVariant();
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
  const filteredOptions = useMemo(
    () =>
      Array.isArray(options)
        ? options.filter(
            (o: { service_id: string }) => o.service_id === selectedServiceId,
          )
        : [],
    [options, selectedServiceId],
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
              setSelectedOptionId('');
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
              Choose which service to add variants to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label>Service *</Label>
            <Select
              value={selectedServiceId}
              onValueChange={(val) => {
                setSelectedServiceId(val);
                setSelectedOptionId('');
              }}
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
      {selectedServiceId && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Select Service Option</CardTitle>
            <CardDescription>
              Choose which option to add variants to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label>Service Option *</Label>
            <Select
              value={selectedOptionId}
              onValueChange={setSelectedOptionId}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {optionsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : filteredOptions.length ? (
                  filteredOptions.map(
                    (option: { id: string; name: string }) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ),
                  )
                ) : (
                  <SelectItem value="none" disabled>
                    No options for this service
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Show variant form only if all are selected */}
      {selectedCategoryId && selectedServiceId && selectedOptionId && (
        <Card>
          <CardHeader>
            <CardTitle>Add Variant</CardTitle>
            <CardDescription>Add a new variant for this option</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                try {
                  await createVariantMutation.mutateAsync({
                    ...variant,
                    service_option_id: selectedOptionId,
                  });
                  setVariant(initialVariant);
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
                <Label htmlFor="variant_name">Variant Name *</Label>
                <Input
                  id="variant_name"
                  value={variant.name}
                  onChange={(e) => {
                    setVariant((v) => ({ ...v, name: e.target.value }));
                    setDirty(true);
                  }}
                  required
                  className="mt-2"
                  disabled={submitting}
                  placeholder="e.g. Large, Premium, etc."
                />
              </div>
              <div>
                <Label htmlFor="variant_type">Type</Label>
                <Input
                  id="variant_type"
                  value={variant.type}
                  onChange={(e) => {
                    setVariant((v) => ({ ...v, type: e.target.value }));
                    setDirty(true);
                  }}
                  className="mt-2"
                  disabled={submitting}
                  placeholder="e.g. size, color, etc."
                />
              </div>
              <div>
                <Label htmlFor="variant_price">Price (ZAR)</Label>
                <Input
                  id="variant_price"
                  type="number"
                  value={variant.price}
                  onChange={(e) => {
                    setVariant((v) => ({
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
                <Label htmlFor="variant_duration">Duration (minutes)</Label>
                <Input
                  id="variant_duration"
                  type="number"
                  value={variant.duration_minutes}
                  onChange={(e) => {
                    setVariant((v) => ({
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
                <Label htmlFor="variant_display_order">Display Order</Label>
                <Input
                  id="variant_display_order"
                  type="number"
                  value={variant.display_order}
                  onChange={(e) => {
                    setVariant((v) => ({
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
                  id="variant_is_active"
                  type="checkbox"
                  checked={variant.is_active}
                  onChange={(e) =>
                    setVariant((v) => ({ ...v, is_active: e.target.checked }))
                  }
                  className="w-4 h-4 rounded"
                  disabled={submitting}
                />
                <Label htmlFor="variant_is_active">Active</Label>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t">
                {dirty && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setVariant(initialVariant);
                      setDirty(false);
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={submitting || !dirty}>
                  {submitting ? 'Adding...' : 'Add Variant'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
