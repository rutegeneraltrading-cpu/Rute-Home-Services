import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { ServiceCategory } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';
import { getCategoriesApi, createCategoryApi } from './categories.api';

/**
 * Query key factory for service categories
 */
export const categoryKeys = {
  all: ['service-categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
};

/**
 * Fetch all active service categories
 */
export const useGetCategories = (
  options?: UseQueryOptions<
    { categories: ServiceCategory[]; total: number },
    Error
  >,
) => {
  const query = useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: getCategoriesApi,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });

  if (query.error) {
    toast({
      variant: 'destructive',
      title: 'Failed to Load Categories',
      description: query.error.message || 'Could not fetch service categories.',
    });
  }

  return query;
};

/**
 * Create a new service category
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategoryApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast({
        variant: 'success',
        title: 'Category Created',
        description: `"${data.category.name}" has been added as a service category.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Create Category',
        description: error.message || 'Could not create service category.',
      });
    },
  });
};
