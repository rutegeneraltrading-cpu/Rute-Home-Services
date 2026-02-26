import type { WorkerProfile } from '@/lib/client/api/workers';
import { UserAddress } from '../../user';

// Re-export Worker from API for convenience
export type { WorkerProfile as Worker } from '@/lib/client/api/workers';

export interface WorkerEditModalProps {
  open: boolean;
  worker: WorkerProfile | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface WorkerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Multi-service support for form values
export interface WorkerFormValues {
  full_name: string;
  email: string;
  phone?: string;
  service_ids: string[];
  address: UserAddress;
}

export interface WorkerEditValues {
  full_name: string;
  phone?: string;
  service_ids: string[];
  status: 'active' | 'inactive' | 'suspended';
  address: UserAddress;
}
