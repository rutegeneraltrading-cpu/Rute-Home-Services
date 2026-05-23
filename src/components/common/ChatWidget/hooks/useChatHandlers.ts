'use client';

import { Message } from '@/lib/types/chat';
import { UseChatReturn } from '@/lib/client/hooks/useChat';

interface UseChatHandlersProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: UseChatReturn['mutate'];
  isPending: boolean;
  sessionId: string;
}

export const useChatHandlers = ({
  messages,
  setMessages,
  setInputValue,
  sendMessage,
  isPending,
  sessionId,
}: UseChatHandlersProps) => {
  const handleSuggestionClick = (question: string) => {
    if (isPending) return;

    const userMessage: Message = {
      role: 'user',
      content: question,
      id: crypto.randomUUID(),
    };

    setMessages((prev) => [...prev, userMessage]);

    sendMessage(
      { messages: [...messages, userMessage], sessionId },
      {
        onSuccess: (data) => {
          const aiMessage: Message = {
            role: 'assistant',
            content: data.message,
            id: crypto.randomUUID(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        },
        onError: (error) => {
          const errorMessage: Message = {
            role: 'assistant',
            content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
            id: crypto.randomUUID(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      }
    );
  };

  const handleSendMessage = (inputValue: string) => {
    if (!inputValue.trim() || isPending) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      id: crypto.randomUUID(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    sendMessage(
      { messages: [...messages, userMessage], sessionId },
      {
        onSuccess: (data) => {
          const aiMessage: Message = {
            role: 'assistant',
            content: data.message,
            id: crypto.randomUUID(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        },
        onError: (error) => {
          const errorMessage: Message = {
            role: 'assistant',
            content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
            id: crypto.randomUUID(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      }
    );
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
    inputValue: string
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return { handleSuggestionClick, handleSendMessage, handleKeyPress };
};
