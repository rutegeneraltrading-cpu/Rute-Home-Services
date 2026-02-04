import { useQuery } from '@tanstack/react-query';
import { getProfileApi } from './profile.api';
import { toast } from '@/components/ui/use-toast';

export const PROFILE_QUERY_KEYS = {
  all: ['profile'] as const,
  detail: () => [...PROFILE_QUERY_KEYS.all, 'detail'] as const,
};

export const useGetProfile = () => {
  const query = useQuery({
    queryKey: PROFILE_QUERY_KEYS.detail(),
    queryFn: getProfileApi,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Show error toast
  if (query.error) {
    toast({
      variant: 'destructive',
      title: 'Failed to Load Profile',
      description: query.error.message || 'Could not fetch profile data.',
    });
  }

  return query;
};
