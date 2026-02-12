// export interface Product extends BaseEntity {
//   name: string;
//   description: string;
//   price: number;
//   image_url: string;
//   category: string;
//   stock: number;
//   is_active: boolean;
// }

export interface ProductCategory {
  id: string;
  name: string;
  description?: string | null;
}

export interface ProductCategoryEditModalProps {
  open: boolean;
  category: ProductCategory | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface ProductCategoryFormProps {
  onSuccess?: () => void;
}

export interface CreateProductDTO {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  sale_price?: number | null;
  brand?: string | null;
  sku?: string | null;
  attributes?: Record<string, unknown> | null;
  stock: number;
  category_id: string;
  images?: string[];
}

export type UpdateProductDTO = Partial<CreateProductDTO>;

export interface Product {
  id: string;
  name: string;
  slug?: string | null;
  description?: string;
  price: number;
  sale_price?: number | null;
  brand?: string | null;
  sku?: string | null;
  attributes?: Record<string, unknown> | null;
  stock: number;
  category_id: string;
  images?: {
    id: string;
    url: string;
    sort_order?: number | null;
    is_primary?: boolean | null;
  }[];
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  category?: {
    id: string;
    name: string;
  };
}
