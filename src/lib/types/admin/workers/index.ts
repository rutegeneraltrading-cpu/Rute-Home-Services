import type { WorkerProfile } from '@/lib/client/api/workers';

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

export interface WorkersTableProps {
  workers: WorkerProfile[];
  isLoading: boolean;
  onEdit?: (worker: WorkerProfile) => void;
}
