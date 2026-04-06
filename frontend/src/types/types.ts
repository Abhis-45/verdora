import { DeliveryEstimate, DeliveryLocation } from "@/utils/delivery";
import { PlantSizeOption } from "@/utils/productOptions";

export interface Product {
  id: number | string;
  name: string;
  slug?: string;
  category?: string;
  desc?: string;
  price: number;
  image?: string;
  mrp?: number;
  description?: string;
  tags?: string[];
  plantSizes?: PlantSizeOption[];
  selectedSize?: PlantSizeOption | null;
  originAddress?: Partial<DeliveryLocation>;
  deliveryEstimate?: DeliveryEstimate | null;
}

export interface SelectedProduct extends Product {
  count: number;
}

export interface SelectedPackage {
  id: number | string;
  slug: string;
  name: string;
  desc: string;
  image?: string;
  deposit?: number;
  relevantCategories?: string[];
  availability?: { date: string; times: string[] }[];
  deliveryDate?: string | null;
  deliveryTime?: string | null;
  selectedProducts: SelectedProduct[];
}

export interface CartItem {
  cartKey?: string;
  id: number | string;
  productId?: string;
  slug?: string;
  name: string;
  price: number;
  image?: string;
  products?: SelectedProduct[];
  deposit?: number;
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryEstimate?: DeliveryEstimate | null;
  originAddress?: Partial<DeliveryLocation>;
  selectedSize?: PlantSizeOption | null;
  plantSizes?: PlantSizeOption[];
  mrp?: number;
  quantity: number;
}

export interface WishlistItem {
  id: number | string;
  slug?: string;
  name: string;
  price: number;
  image?: string;
  products?: SelectedProduct[];
  deposit?: number;
  deliveryDate?: string;
  deliveryTime?: string;
}

export interface Profile {
  name?: string;
  dob?: string;
  gender?: string;
  address?: string;
  mobile?: string;
  email?: string;
}
