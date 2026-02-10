import { useQuery } from '@tanstack/react-query';
import { getContactMessagesApi } from './contact.api';

export const CONTACT_MESSAGE_KEYS = {
  all: ['contact-messages'] as const,
  list: () => [...CONTACT_MESSAGE_KEYS.all, 'list'] as const,
};

export const useGetContactMessages = () => {
  return useQuery({
    queryKey: CONTACT_MESSAGE_KEYS.list(),
    queryFn: getContactMessagesApi,
    staleTime: 2 * 60 * 1000,
  });
};
