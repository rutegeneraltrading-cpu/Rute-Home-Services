'use client';

import { useState } from 'react';
import { DataTable } from '@/components/common';
import { DataTableConfig, TableColumn, TableAction } from '@/lib/types/table';
import { useGetProducts } from '@/lib/client/api/products';
import { useDeleteProduct } from '@/lib/client/api/products';
import { Product } from '@/lib/client/api/products/products.api';
import { Edit2, Trash2, Eye } from 'lucide-react';

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
          {value}
        </span>
      ),
    },
    {
      id: 'price',
      header: 'Price',
      accessorKey: 'price',
      sortable: true,
      cell: (value) => `$${value}`,
    },
    {
      id: 'stock',
      header: 'Stock',
      accessorKey: 'stock',
      sortable: true,
    },
    {
      id: 'created_at',
      header: 'Created',
      accessorKey: 'created_at',
      cell: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const actions: TableAction[] = [
    {
      id: 'view',
      label: 'View',
      icon: Eye,
      onClick: (row) => console.log('View:', row),
    },
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
            },
            onError: () => {
              setDeletingId(null);
            },
          });
        }
      },
      variant: 'destructive',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
      </div>

      <DataTable<Product>
        config={{
          data: products,
          columns,
          actions,
          isLoading: isLoading || deleteProductMutation.isPending,
        }}
      />
    </div>
  );
}

export default ProductsPage;