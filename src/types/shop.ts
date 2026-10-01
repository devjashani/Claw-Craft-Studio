import { Database } from "./database.types";

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  images?: ProductImage[];
};
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type Coupon = Database["public"]["Tables"]["coupons"]["Row"];
export type CustomRequest = Database["public"]["Tables"]["custom_requests"]["Row"];
export type SiteSetting = Database["public"]["Tables"]["site_settings"]["Row"];

export type ProductWithImages = Product;

export interface CheckoutAddress {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}
