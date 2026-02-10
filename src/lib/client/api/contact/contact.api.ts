import { httpClient } from '@/lib/client/http';
import type { ContactMessageInput } from '@/lib/validations';

export interface ContactMessage {
  id: string;
  profile_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  subject: 'general' | 'booking' | 'payments' | 'account' | 'other';
  message: string;
  status: 'new' | 'read' | 'resolved';
  created_at: string;
}

export const createContactMessageApi = (
  data: ContactMessageInput,
): Promise<{ message: string }> => httpClient.post('/api/contact', data);

export const getContactMessagesApi = (): Promise<{
  contacts: ContactMessage[];
  total: number;
}> => httpClient.get('/api/admin/contacts');

export const updateContactMessageApi = (
  id: string,
  data: { status: ContactMessage['status'] },
): Promise<{ contact: ContactMessage }> =>
  httpClient.put(`/api/admin/contacts/${id}`, data);

export const deleteContactMessageApi = (
  id: string,
): Promise<{ success: boolean }> =>
  httpClient.delete(`/api/admin/contacts/${id}`);
