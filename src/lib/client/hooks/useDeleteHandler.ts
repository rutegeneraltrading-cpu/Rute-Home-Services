import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { UseDeleteHandlerOptions } from '@/lib/types/hooks';

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
