'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit2, Trash2 } from 'lucide-react';
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
  ProductForm,
  ProductCategoryForm,
  ProductCategoryEditModal,
} from '@/components/pages/admin/productForms';
import type { TableAction, TableColumn } from '@/lib/types/table';
import {
  useGetProductCategories,
  useDeleteProductCategory,
} from '@/lib/client/api';

interface ProductCategory {
  id: string;
  name: string;
  description?: string | null;
}

const NewProductPage = () => {
  const [step, setStep] = useState<'category' | 'product'>('category');
  const { data: categories = [], isLoading: categoriesLoading } =
    useGetProductCategories();
  const deleteCategoryMutation = useDeleteProductCategory();
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
      <Card className="md:p-6 md:border border-hidden md:shadow-sm shadow-none">
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
              disabled={deleteCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteCategory) return;
                deleteCategoryMutation.mutate(deleteCategory.id, {
                  onSuccess: () => {
                    setDeleteCategory(null);
                    toast.success('Category deleted successfully');
                  },
                  onError: (error) => {
                    const errorMessage =
                      error instanceof Error
                        ? error.message
                        : 'Failed to delete product category';
                    toast.error(errorMessage);
                  },
                });
              }}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewProductPage;
