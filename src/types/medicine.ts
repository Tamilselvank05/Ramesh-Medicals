
export interface Medicine {
  id: string;
  name: string;
  stock: number;
  price: number;
  tax: number;
  expiry_date: string;
  prescription_required?: boolean;
  vendor_id?: string;
  discount: number;
  vendors?: {
    id: string;
    name: string;
    shop_address?: string;
    phone?: string;
    email?: string;
  };
  price_after_discount?: number;
}

export interface MedicineWithVendor extends Medicine {
  vendors: {
    id: string;
    name: string;
    shop_address?: string;
    phone?: string;
    email?: string;
  };
}
