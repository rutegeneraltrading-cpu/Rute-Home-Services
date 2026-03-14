'use client';

import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { DataTable, DeleteConfirmationDialog } from '@/components/common';
import { DataTableConfig, TableAction, TableColumn } from '@/lib/types';
import {
  ContactMessage,
  useDeleteContactMessage,
  useGetContactMessages,
} from '@/lib/client/api';
import { ContactEditModal } from './modals/ContactEditModal';

const ContactsPage = () => {
  const { data, isLoading } = useGetContactMessages();
  const contacts = data?.contacts || [];
  const deleteContactMutation = useDeleteContactMessage();
  const [editingContact, setEditingContact] = useState<ContactMessage | null>(
    null,
  );
  const [deletingContact, setDeletingContact] = useState<ContactMessage | null>(
    null,
  );

  const columns: TableColumn<ContactMessage>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
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
      sortable: false,
      cell: (value) => value || '-',
    },
    {
      id: 'subject',
      header: 'Subject',
      accessorKey: 'subject',
      sortable: true,
      cell: (value) =>
        value
          ? String(value)
              .split('_')
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ')
          : '-',
    },
    {
      id: 'message',
      header: 'Message',
      accessorKey: 'message',
      sortable: false,
      cell: (value) =>
        value && typeof value === 'string'
          ? `${value.slice(0, 60)}${value.length > 60 ? '…' : ''}`
          : '-',
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            value === 'resolved'
              ? 'bg-green-100 text-green-800'
              : value === 'read'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {value || 'new'}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Received',
      accessorKey: 'created_at',
      sortable: true,
      cell: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const actions: TableAction[] = [
    {
      id: 'edit',
      label: 'Update Status',
      icon: Edit2,
      onClick: (contact: ContactMessage) => setEditingContact(contact),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (contact: ContactMessage) => setDeletingContact(contact),
    },
  ];

  const tableConfig: DataTableConfig<ContactMessage> = {
    data: contacts,
    columns,
    actions,
    defaultSortBy: 'created_at',
    defaultSortOrder: 'desc',
    pageSize: 10,
    showSearch: true,
    showPagination: true,
    isLoading: isLoading || deleteContactMutation.isPending,
    emptyState: {
      title: 'No contact messages found',
      description: 'New contact requests will appear here.',
    },
  };

  return (
    <div className="py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contact Messages</h1>
          <p className="text-sm text-gray-600">
            Manage contact requests from customers
          </p>
        </div>
      </div>

      <DataTable<ContactMessage> config={tableConfig} />

      <ContactEditModal
        open={!!editingContact}
        contact={editingContact}
        onOpenChange={(open) => {
          if (!open) setEditingContact(null);
        }}
        onSuccess={() => setEditingContact(null)}
      />

      <DeleteConfirmationDialog
        open={!!deletingContact}
        onOpenChange={(open) => {
          if (!open) setDeletingContact(null);
        }}
        title="Delete Contact Message"
        itemName={deletingContact?.name}
        description="This will permanently delete the contact message."
        onConfirm={() => {
          if (!deletingContact) return;
          deleteContactMutation.mutate(deletingContact.id, {
            onSuccess: () => setDeletingContact(null),
          });
        }}
        isDeleting={deleteContactMutation.isPending}
      />
    </div>
  );
};

export default ContactsPage;
