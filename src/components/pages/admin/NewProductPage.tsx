'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ProductCategoryForm,
  ProductCategoryEditModal,
  ProductForm,
} from '@/components/pages/admin/productForms';
import { useGetProductCategories } from '@/lib/client/api/products';
import { productKeys } from '@/lib/client/api/products/products.query';
import type { TableAction, TableColumn } from '@/lib/types/table';
import { Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductCategory {
  id: string;
  name: string;
  description?: string | null;
}

const NewProductPage = () => {
  const [step, setStep] = useState<'category' | 'product'>('category');
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading: categoriesLoading } =
    useGetProductCategories();
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<ProductCategory | null>(
    null,
  );

  const categoryColumns: TableColumn<ProductCategory>[] = [
    {
      id: 'name',
      header: 'Category Name',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      sortable: false,
      cell: (value) => value || '-',
    },
  ];

  const categoryActions: TableAction[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit2,
      onClick: (row) => setEditingCategory(row),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row) => setDeleteCategory(row),
    },
  ];

  return (
    <div className="py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Products</h1>
        <p className="text-gray-600 mt-2">Step 1: Category → Step 2: Product</p>
      </div>

      {/* Step Navigation */}
      <div className="flex gap-4 mb-8">
        <Button
          onClick={() => setStep('category')}
          variant={step === 'category' ? 'default' : 'outline'}
        >
          1. Category
        </Button>
        <Button
          onClick={() => setStep('product')}
          variant={step === 'product' ? 'default' : 'outline'}
        >
          2. Product
        </Button>
      </div>

      {/* Content */}
      <Card className="p-6">
        {step === 'category' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Product Category</h2>
            <ProductCategoryForm
              onSuccess={() => {
                // Optionally auto-switch to product step after category created
                // setStep('product');
              }}
            />

            <div className="mt-10">
              <DataTable<ProductCategory>
                title="All Categories"
                description="Manage your product categories"
                config={{
                  data: categories,
                  columns: categoryColumns,
                  actions: categoryActions,
                  isLoading: categoriesLoading,
                  pageSize: 10,
                  defaultSortBy: 'name',
                  defaultSortOrder: 'asc',
                  showSearch: true,
                  showPagination: true,
                  emptyState: {
                    title: 'No categories found',
                    description: 'Create your first product category above.',
                  },
                }}
              />
            </div>
          </div>
        )}

        {step === 'product' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Product</h2>
            <ProductForm />
          </div>
        )}
      </Card>

      <ProductCategoryEditModal
        open={!!editingCategory}
        category={editingCategory}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null);
        }}
        onSuccess={() => setEditingCategory(null)}
      />

      <Dialog
        open={!!deleteCategory}
        onOpenChange={(open) => {
          if (!open) setDeleteCategory(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Deleting this category will also delete all products linked to it.
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteCategory?.name}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteCategory(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (!deleteCategory) return;
                try {
                  const response = await fetch(
                    `/api/admin/product-categories/${deleteCategory.id}`,
                    { method: 'DELETE' },
                  );

                  if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(
                      error.error || 'Failed to delete product category',
                    );
                  }

                  setDeleteCategory(null);
                  await queryClient.invalidateQueries({
                    queryKey: ['product-categories'],
                  });
                  await queryClient.invalidateQueries({
                    queryKey: productKeys.lists(),
                  });
                  toast.success('Category deleted successfully');
                } catch (error) {
                  const errorMessage =
                    error instanceof Error
                      ? error.message
                      : 'Failed to delete product category';
                  toast.error(errorMessage);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewProductPage;
