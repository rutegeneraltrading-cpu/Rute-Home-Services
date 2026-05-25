import { useMutation } from '@tanstack/react-query';
import { Message, ChatResponse, ChatError } from '@/lib/types/chat';

type SendPayload = { messages: Message[]; sessionId?: string };

const sendChatMessage = async (payload: SendPayload): Promise<ChatResponse> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData: ChatError = await response.json();
    throw new Error(errorData.error || 'Failed to send message');
  }

  return response.json();
};

export const useChat = () => {
  return useMutation<ChatResponse, Error, SendPayload>({
    mutationFn: sendChatMessage,
    retry: 1,
  });
};

export type UseChatReturn = ReturnType<typeof useChat>;
