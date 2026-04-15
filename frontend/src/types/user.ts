/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeliveryEstimate, DeliveryLocation } from "@/utils/delivery";
import { PlantSizeOption } from "@/utils/productOptions";
import { UploadedImage } from "@/utils/attachments";

export interface Address {
  _id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  gender: string;
  dob: string;
  addresses: Address[];
}

export interface OrderItem {
  productName: string;
  _id?: string;
  id: string;
  title: string;
  image: string;
  price: number;
  mrp: number;
  quantity: number;
  vendorId?: string;
  vendorName?: string;
  status?: string;
  statusReason?: string;
  returnReason?: string;
  trackingId?: string;
  deliveryOTP?: string;
  statusUpdatedAt?: string;
  reviewSubmitted?: boolean;
  reviewId?: string | null;
  reviewedAt?: string | null;
  returnRequestImages?: UploadedImage[];
  canReview?: boolean;
  canReturnOrReplace?: boolean;
  returnWindowEndsAt?: string;
  selectedSize?: PlantSizeOption | null;
  originAddress?: Partial<DeliveryLocation>;
  deliveryEstimate?: DeliveryEstimate | null;
}

export interface Addresses {
  label: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  returnReason?: string;
  statusReason?: string;
  status: string;
  statusUpdatedAt?: string;
  services: any[];
  _id: string;
  items: OrderItem[];
  total: number;
  discount: number;
  couponCode?: string;
  address?: Addresses;
  mobile?: string;
  email?: string;
  name?: string;
  date: string;
  deliveryEstimate?: DeliveryEstimate | null;
}
