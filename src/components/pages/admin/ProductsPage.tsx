'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Edit2, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/common';
import { TableColumn, TableAction, Product } from '@/lib/types';
import { useGetProducts, useDeleteProduct } from '@/lib/client/api/products';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { ProductEditModal } from '@/components/pages/admin/productForms';

const ProductsPage = () => {
  const { data: products = [], isLoading } = useGetProducts();
  const deleteProductMutation = useDeleteProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const columns: TableColumn<Product>[] = [
    {
      id: 'name',
      header: 'Product Name',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          {value?.name || 'N/A'}
        </span>
      ),
    },
    {
      id: 'slug',
      header: 'Slug',
      accessorKey: 'slug',
      sortable: true,
      cell: (value) => (
        <span className="text-xs text-slate-600">{value || '—'}</span>
      ),
    },
    {
      id: 'sku',
      header: 'SKU',
      accessorKey: 'sku',
      sortable: true,
      cell: (value) => (
        <span className="text-xs font-medium text-slate-700">
          {value || '—'}
        </span>
      ),
    },
    {
      id: 'brand',
      header: 'Brand',
      accessorKey: 'brand',
      sortable: true,
      cell: (value) => (
        <span className="text-xs text-slate-600">{value || '—'}</span>
      ),
    },
    {
      id: 'price',
      header: 'Price',
      accessorKey: 'price',
      sortable: true,
      cell: (value) => `R${parseFloat(value).toFixed(2)}`,
    },
    {
      id: 'sale_price',
      header: 'Sale Price',
      accessorKey: 'sale_price',
      sortable: true,
      cell: (value) => (value ? `R${parseFloat(value).toFixed(2)}` : '—'),
    },
    {
      id: 'stock',
      header: 'Stock',
      accessorKey: 'stock',
      sortable: true,
      cell: (value) => (
        <span
          className={
            value > 0
              ? 'text-green-600 font-semibold'
              : 'text-red-600 font-semibold'
          }
        >
          {value} units
        </span>
      ),
    },
    {
      id: 'is_active',
      header: 'Status',
      accessorKey: 'is_active',
      cell: (value) => (
        <span
          className={
            value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: '500',
          }}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Created',
      accessorKey: 'created_at',
      sortable: true,
      cell: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const actions: TableAction[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit2,
      onClick: (row) => setEditingProduct(row),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: (row) => setDeleteProduct(row),
      variant: 'destructive',
    },
  ];

  return (
    <div className="space-y-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your e-commerce products</p>
        </div>
        <Link href="/admin/products/new">
          <Button>+ Add Product</Button>
        </Link>
      </div>

      <DataTable<Product>
        config={{
          data: products,
          columns,
          actions,
          isLoading: isLoading || deleteProductMutation.isPending,
          pageSize: 10,
          defaultSortBy: 'created_at',
          defaultSortOrder: 'desc',
        }}
      />

      <ProductEditModal
        open={!!editingProduct}
        product={editingProduct}
        onOpenChange={(open) => {
          if (!open) setEditingProduct(null);
        }}
        onSuccess={() => setEditingProduct(null)}
      />

      <Dialog
        open={!!deleteProduct}
        onOpenChange={(open) => {
          if (!open) setDeleteProduct(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteProduct?.name}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteProduct(null)}
              disabled={deleteProductMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteProduct) return;
                deleteProductMutation.mutate(deleteProduct.id, {
                  onSuccess: () => {
                    setDeleteProduct(null);
                    toast.success('Product deleted successfully');
                  },
                  onError: () => {
                    toast.error('Failed to delete product');
                  },
                });
              }}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? (
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

export default ProductsPage;
