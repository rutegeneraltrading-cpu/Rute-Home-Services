export type AddressLabel = 'home' | 'office' | 'other';

export interface UserAddress {
  id: string;
  profile_id: string;
  label: AddressLabel;
  recipient_name: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserAddressDTO {
  label?: AddressLabel;
  recipient_name?: string | null;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  is_primary?: boolean;
}

export interface UpdateUserAddressDTO extends Partial<CreateUserAddressDTO> {
  is_primary?: boolean;
}

export interface UserAddressFormValues {
  label: AddressLabel;
  recipient_name?: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  is_primary?: boolean;
}
