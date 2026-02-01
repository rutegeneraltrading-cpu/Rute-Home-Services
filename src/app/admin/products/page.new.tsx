'use client';

import { useState } from 'react';
import { DataTable } from '@/components/common';
import { DataTableConfig, TableColumn, TableAction } from '@/lib/types/table';
import { useGetProducts } from '@/lib/api/products.query';
import { useDeleteProduct } from '@/lib/api/products.mutation';
import { Product } from '@/lib/api/products.api';
import { Edit2, Trash2, Eye } from 'lucide-react';

export default function ProductsPage() {
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
      cell: (value) => (
        <span className={value > 0 ? 'text-green-600' : 'text-red-600'}>
          {value}
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
      id: 'view',
      label: 'View',
      icon: Eye,
      onClick: (product: Product) => {
        console.log('View product:', product);
      },
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit2,
      onClick: (product: Product) => {
        console.log('Edit product:', product);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (product: Product) => {
        setDeletingId(product.id);
        deleteProductMutation.mutate(product.id, {
          onSuccess: () => {
            setDeletingId(null);
          },
          onError: (error) => {
            setDeletingId(null);
            console.error('Delete failed:', error);
          },
        });
      },
    },
  ];

  const tableConfig: DataTableConfig<Product> = {
    data: products,
    columns,
    actions,
    defaultSortBy: 'created_at',
    defaultSortOrder: 'desc',
    pageSize: 10,
    showSearch: true,
    showPagination: true,
    isLoading: isLoading || deletingId !== null,
    emptyState: {
      title: 'No products found',
      description: 'Get started by creating a new product.',
    },
  };

  return (
    <div className="p-6">
      <DataTable<Product>
        config={tableConfig}
        title="Products"
        description="Manage all products in your store"
      />
    </div>
  );
}
