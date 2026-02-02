'use client';

import { DataTable } from '@/components/common';
import { DataTableConfig, TableColumn, TableAction } from '@/lib/types/table';
import { useGetUsers } from '@/lib/client/api/users';
import { useDeleteUser } from '@/lib/client/api/users';
import type { User } from '@/lib/client/api/users';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';

export default function UsersPage() {
  const { data, isLoading } = useGetUsers();
  const users = data?.users || [];
  const deleteUserMutation = useDeleteUser();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const columns: TableColumn<User>[] = [
    {
      id: 'full_name',
      header: 'Name',
      accessorKey: 'full_name',
      sortable: true,
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      sortable: true,
    },
    {
      id: 'role',
      header: 'Role',
      accessorKey: 'role',
      sortable: true,
      cell: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            value === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Joined',
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
      onClick: (user: User) => {
        console.log('View user:', user);
      },
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit2,
      onClick: (user: User) => {
        console.log('Edit user:', user);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (user: User) => {
        setDeletingId(user.id);
        deleteUserMutation.mutate(user.id, {
          onSuccess: () => {
            setDeletingId(null);
          },
        });
      },
      showWhen: (user: User) => user.role !== 'admin',
    },
  ];

  const tableConfig: DataTableConfig<User> = {
    data: users,
    columns,
    actions,
    defaultSortBy: 'created_at',
    defaultSortOrder: 'desc',
    pageSize: 10,
    showSearch: true,
    showPagination: true,
    isLoading: isLoading || deletingId !== null,
    emptyState: {
      title: 'No users found',
      description: 'Get started by creating a new user.',
    },
  };
  console.log('users:', users);

  return (
    <div className="p-6">
      <DataTable<User>
        config={tableConfig}
        title="Users"
        description="Manage and view all users in your system"
      />
    </div>
  );
}
