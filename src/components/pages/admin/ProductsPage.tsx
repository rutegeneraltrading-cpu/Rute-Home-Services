'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/common';
import { DataTableConfig, TableColumn, TableAction } from '@/lib/types/table';
import { useGetProducts } from '@/lib/client/api/products';
import { useDeleteProduct } from '@/lib/client/api/products';
import { Product } from '@/lib/client/api/products/products.api';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ProductsPage = () => {
  const { data: products = [], isLoading } = useGetProducts();
  const deleteProductMutation = useDeleteProduct();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      id: 'price',
      header: 'Price',
      accessorKey: 'price',
      sortable: true,
      cell: (value) => `R${parseFloat(value).toFixed(2)}`,
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
      onClick: (row) => console.log('Edit:', row),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: (row) => {
        if (confirm(`Delete product "${row.name}"?`)) {
          setDeletingId(row.id);
          deleteProductMutation.mutate(row.id, {
            onSuccess: () => {
              setDeletingId(null);
              toast.success('Product deleted successfully');
            },
            onError: () => {
              setDeletingId(null);
              toast.error('Failed to delete product');
            },
          });
        }
      },
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
          <Button className="bg-blue-600 hover:bg-blue-700">
            + Add Product
          </Button>
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
    </div>
  );
};

export default ProductsPage;
