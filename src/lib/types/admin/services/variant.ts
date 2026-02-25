// Service Option Variant Types

export interface ServiceOptionVariant {
  id: string;
  service_option_id: string;
  name: string;
  type: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface CreateServiceOptionVariantDTO {
  service_option_id: string;
  name: string;
  type: string;
  price: number;
  duration_minutes: number;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateServiceOptionVariantDTO {
  name?: string;
  type?: string;
  price?: number;
  duration_minutes?: number;
  is_active?: boolean;
  display_order?: number;
}
