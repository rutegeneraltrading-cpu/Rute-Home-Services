import { httpClient } from '@/lib/client/http';
import { Profile, UpdateProfileRequest } from '@/lib/types';

const BASE_URL = '/api/admin/profile';

// Re-export types
export type { Profile, UpdateProfileRequest };

// ============================================
// PROFILE API
// ============================================

/**
 * Get current user profile
 */
export const getProfileApi = async (): Promise<Profile> => {
  return httpClient.get<Profile>(BASE_URL);
};

/**
 * Update current user profile
 */
export const updateProfileApi = async (
  data: UpdateProfileRequest,
): Promise<Profile> => {
  return httpClient.put<Profile>(BASE_URL, data);
};
