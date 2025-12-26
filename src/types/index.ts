// Base types for the inventory management system

export type DiscountType = "volume" | "black_friday" | "holiday" | "none";

export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICustomer {
  id: string;
  name: string;
  location: "US" | "EU" | "ASIA";
  createdAt: string;
}

export interface IOrderItem {
  productId: string;
  quantity: number;
}

export interface IOrder {
  id: string;
  customerId: string;
  products: IOrderItem[];
  total: number;
  discountApplied?: DiscountType;
  discountAmount?: number;
  createdAt: string;
}
