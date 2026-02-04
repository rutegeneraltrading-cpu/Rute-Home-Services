import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCategoryApi,
  updateServiceCategoryApi,
  deleteServiceCategoryApi,
  UpdateServiceCategoryDTO,
} from './categories.api';
import { CreateServiceCategoryDTO } from '@/lib/types';
import { categoryKeys } from './categories.query';

/**
 * Create service category
 */
export const useCreateServiceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceCategoryDTO) => createCategoryApi(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success(`Category "${data.category.name}" created successfully!`);
    },
    onError: (error: Error) => {
      console.error('Error creating category:', error);
      toast.error(error.message || 'Failed to create category');
    },
  });
};

/**
 * Update service category
 */
export const useUpdateServiceCategory = (categoryId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateServiceCategoryDTO) =>
      updateServiceCategoryApi(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success('Category updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Error updating category:', error);
      toast.error(error.message || 'Failed to update category');
    },
  });
};

/**
 * Delete service category
 */
export const useDeleteServiceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => deleteServiceCategoryApi(categoryId),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['serviceOptions'] });
      toast.success('Category deleted successfully!');
    },
    onError: (error: Error) => {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    },
  });
};
