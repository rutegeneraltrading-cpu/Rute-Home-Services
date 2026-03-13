// Service Requirement Types

export interface ServiceRequirement {
  id: string;
  service_id: string;
  name: string;
  type: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface CreateServiceRequirementDTO {
  service_id: string;
  name: string;
  type: string;
  price: number;
  duration_minutes: number;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateServiceRequirementDTO {
  name?: string;
  type?: string;
  price?: number;
  duration_minutes?: number;
  is_active?: boolean;
  display_order?: number;
}

// Backward-compatible aliases
export type ServiceOptionVariant = ServiceRequirement;
export type CreateServiceOptionVariantDTO = CreateServiceRequirementDTO;
export type UpdateServiceOptionVariantDTO = UpdateServiceRequirementDTO;
