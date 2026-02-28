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
// Worker document type for uploads
export interface WorkerDocument {
  type: string; // Should match DocumentType enum
  file_url: string;
}

export interface WorkerFormValues {
  full_name: string;
  email: string;
  phone: string; // Required for registration
  service_ids: string[];
  address: UserAddress;
  documents: WorkerDocument[]; // Uploaded documents
  // Add more fields here for future extensibility
}

export interface WorkerEditValues {
  full_name: string;
  phone: string;
  service_ids: string[];
  status: 'active' | 'inactive' | 'suspended';
  address: UserAddress;
  // Add more fields here for future extensibility
}

export enum DocumentType {
  Identity = 'identity',
  Passport = 'passport',
  ProofOfResidency = 'proof_of_residency',
  BusinessRegistration = 'business_registration',
  BankConfirmation = 'bank_confirmation',
  ShareholderId = 'shareholder_id',
}