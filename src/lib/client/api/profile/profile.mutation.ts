import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileAPI, UpdateProfileRequest } from './profile.api';
import { PROFILE_QUERY_KEYS } from './profile.query';
import { toast } from '@/components/ui/use-toast';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileAPI.updateProfile(data),
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_QUERY_KEYS.detail(), data);

      toast({
        variant: 'success',
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update profile.',
      });
    },
  });
};
