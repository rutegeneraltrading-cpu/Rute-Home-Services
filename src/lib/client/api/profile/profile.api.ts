import { httpClient } from '@/lib/client/http';

export interface Profile {
  auth_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: 'admin' | 'user' | 'worker';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  avatar_url?: string;
}

const BASE_URL = '/api/admin/profile';

export const profileAPI = {
  getProfile: async (): Promise<Profile> => {
    return httpClient.get<Profile>(BASE_URL);
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<Profile> => {
    return httpClient.put<Profile>(BASE_URL, data);
  },
};
