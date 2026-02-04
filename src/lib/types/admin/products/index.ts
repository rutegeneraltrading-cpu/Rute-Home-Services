

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
  description?: string;
  price: number;
  stock: number;
  category_id: string;
  image_url?: string;
}

export type UpdateProductDTO = Partial<CreateProductDTO>;

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category_id: string;
  image_url?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  category?: {
    id: string;
    name: string;
  };
}
