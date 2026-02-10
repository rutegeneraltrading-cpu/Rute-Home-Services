import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import {
  createContactMessageApi,
  deleteContactMessageApi,
  updateContactMessageApi,
  ContactMessage,
} from './contact.api';
import type { ContactMessageInput } from '@/lib/validations';
import { CONTACT_MESSAGE_KEYS } from './contact.query';

export const useCreateContactMessage = () => {
  return useMutation({
    mutationFn: (data: ContactMessageInput) => createContactMessageApi(data),
    onSuccess: () => {
      toast({
        variant: 'success',
        title: 'Message sent',
        description: 'We will get back to you shortly.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to send',
        description: error.message || 'Please try again in a few minutes.',
      });
    },
  });
};

export const useUpdateContactMessage = (contactId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { status: ContactMessage['status'] }) =>
      updateContactMessageApi(contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_MESSAGE_KEYS.list() });
      toast({
        variant: 'success',
        title: 'Contact Updated',
        description: 'Contact message status updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update contact message.',
      });
    },
  });
};

export const useDeleteContactMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContactMessageApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_MESSAGE_KEYS.list() });
      toast({
        variant: 'success',
        title: 'Contact Deleted',
        description: 'Contact message deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete contact message.',
      });
    },
  });
};
