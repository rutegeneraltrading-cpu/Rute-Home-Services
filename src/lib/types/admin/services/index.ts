// import { BaseEntity } from '../../common';

// export interface Service extends BaseEntity {
//   name: string;
//   description: string;
//   price: number;
//   image_url: string;
//   category: string;
//   duration_minutes: number;
//   is_active: boolean;
// }

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  display_order?: number | null;
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
  description?: string | null;
  base_price: number;
  duration_minutes: number;
  is_active: boolean;
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
  description: string;
  base_price: string;
  duration_minutes: string;
};

export interface ServiceOptionItem {
  id: string;
  service_id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes?: number | null;
  is_required?: boolean;
  display_order?: number | null;
  is_active?: boolean;
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
  display_order?: number | null;
  created_at: string;
}

export interface CreateServiceCategoryDTO {
  name: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  category_id: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CreateServiceDTO {
  name: string;
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
  display_order?: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateServiceOptionDTO {
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  is_required?: boolean;
  display_order?: number;
}
