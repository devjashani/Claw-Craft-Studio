import { Database } from "./database.types";

export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  images?: ProductImage[];
  variants?: ProductVariant[];
  tag?: string | null;
  tags?: string[];
  custom_badge?: string;
  custom_chip?: string;
  card_tagline?: string;
  safety_notice?: string;
  object_position?: string;
  is_portrait?: boolean;
  price_prefix?: string;
};
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  items?: OrderItem[];
  isDemo?: boolean;
  coupon_code?: string | null;
};
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type Coupon = Database["public"]["Tables"]["coupons"]["Row"];
export type CustomRequest = Database["public"]["Tables"]["custom_requests"]["Row"];
export type SiteSetting = Database["public"]["Tables"]["site_settings"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Address = Database["public"]["Tables"]["addresses"]["Row"];

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
