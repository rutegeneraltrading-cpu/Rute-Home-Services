'use client';

import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/common';
import { DeleteConfirmationDialog, SectionHeader } from '@/components/common';
import { DataTableConfig, TableColumn, TableAction } from '@/lib/types/table';
import { useGetUsers, useDeleteUser } from '@/lib/client/api/users';
import { UserEditModal, UserCreateModal } from './userForms';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/types';

export default function UsersPage() {
  const { data, isLoading } = useGetUsers();
  const users = data?.users || [];
  const deleteUserMutation = useDeleteUser();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone',
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
      id: 'edit',
      label: 'Edit',
      icon: Edit2,
      onClick: (user: User) => {
        setEditingUser(user);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (user: User) => {
        setDeletingUser(user);
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
    isLoading: isLoading || deleteUserMutation.isPending,
    emptyState: {
      title: 'No users found',
      description: 'Get started by creating a new user.',
    },
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    deleteUserMutation.mutate(deletingUser.id, {
      onSuccess: () => {
        toast.success('User deleted successfully');
        setDeletingUser(null);
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete user');
      },
    });
  };

  return (
    <div className="py-12">
      <SectionHeader
        title="Users"
        description="Manage and view all users in your system"
        action={
          <Button onClick={() => setIsCreateOpen(true)}>Create User</Button>
        }
      />

      <DataTable<User> config={tableConfig} />

      <UserCreateModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => setIsCreateOpen(false)}
      />

      <UserEditModal
        open={!!editingUser}
        user={editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
        onSuccess={() => setEditingUser(null)}
      />

      <DeleteConfirmationDialog
        open={!!deletingUser}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null);
        }}
        title="Delete User"
        itemName={deletingUser?.full_name || deletingUser?.name}
        onConfirm={handleDeleteUser}
        isDeleting={deleteUserMutation.isPending}
      />
    </div>
  );
}
