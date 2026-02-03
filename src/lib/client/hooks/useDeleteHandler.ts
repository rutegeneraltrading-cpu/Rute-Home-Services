import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UseDeleteHandlerOptions {
  endpoint: (id: string) => string;
  successMessage: string;
  errorMessage?: string;
  invalidateQueries?: string[][];
}

export function useDeleteHandler({
  endpoint,
  successMessage,
  errorMessage = 'Failed to delete',
  invalidateQueries = [],
}: UseDeleteHandlerOptions) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(endpoint(id), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || errorMessage);
      }

      for (const queryKey of invalidateQueries) {
        await queryClient.invalidateQueries({ queryKey });
      }

      toast.success(successMessage);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      toast.error(message);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { handleDelete, isDeleting };
}
