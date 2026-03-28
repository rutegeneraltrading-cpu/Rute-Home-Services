export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  charge_type: 'hourly' | 'day';
  display_order: number;
}

export interface ServiceCategoryEditModalProps {
  open: boolean;
  category: ServiceCategory | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface ServiceItem {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string | null;
  base_price: number;
  duration_minutes: number;
  is_active: boolean;
  platform_fee?: number;
  priority_fee?: number;
}

export interface ServiceEditModalProps {
  open: boolean;
  service: ServiceItem | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface ServiceFormProps {
  onServiceCreated?: (serviceId: string) => void;
}

export type ServiceFormValues = {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  duration_minutes: string;
  platform_fee: number;
  priority_fee: number;
};

export interface ServiceOptionItem {
  id: string;
  service_id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes?: number | null;
  is_required?: boolean;
  is_active?: boolean;
  display_order?: number;
  type: string;
  platform_fee: number;
}

export interface ServiceOptionEditModalProps {
  open: boolean;
  option: ServiceOptionItem | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface ServiceOptionsFormProps {
  serviceId?: string;
  serviceName?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  charge_type: 'hourly' | 'day';
  created_at: string;
}

export interface CreateServiceCategoryDTO {
  name: string;
  description?: string;
  image_url?: string;
  charge_type: 'hourly' | 'day';
  is_active?: boolean;
  display_order: number;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string;
  base_price: number;
  category_id: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  priority_fee?: number; // Priority (instant booking) fee
  category?: {
    id: string;
    name: string;
    slug: string;
    charge_type: 'hourly' | 'day';
    description?: string;
  };
}

export interface CreateServiceDTO {
  name: string;
  slug: string;
  description?: string;
  base_price: number;
  category_id: string;
  duration_minutes?: number;
}

export interface ServiceOption {
  id: string;
  service_id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CreateServiceOptionDTO {
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  is_required?: boolean;
}

export * from './variant';
