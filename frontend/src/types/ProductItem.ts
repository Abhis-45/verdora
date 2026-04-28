import { DeliveryEstimate, DeliveryLocation } from "@/utils/delivery";
import { PlantSizeOption, PotOption } from "@/utils/productOptions";

export type NestedProduct = {
  id: number | string;
  name: string;
  price: number;
  count: number;
  image?: string;
};

export type ProductItem = {
  cartKey?: string;
  category?: string;
  id: number | string;
  productId?: string;
  slug?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  mrp?: number;
  products?: NestedProduct[];
  deposit?: number;
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryEstimate?: DeliveryEstimate | null;
  originAddress?: Partial<DeliveryLocation>;
  selectedSize?: PlantSizeOption | null;
  plantSizes?: PlantSizeOption[];
  tags?: string[];
  vendorName?: string;
  includePot?: boolean;
  selectedPotOption?: PotOption | null;
};

export type CartContextType = {
  cartItems: ProductItem[];
  addToCart: (product: Omit<ProductItem, "quantity">) => void;
  updateQuantity: (id: number | string, qty: number) => void;
  updateItemSize: (id: number | string, size: PlantSizeOption) => void;
  updateItemPot: (
    id: number | string,
    includePot: boolean,
    selectedPotOption?: PotOption | null,
  ) => void;
  removeFromCart: (id: number | string) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;
};
