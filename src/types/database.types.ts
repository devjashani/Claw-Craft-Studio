export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type CouponDiscountType = "percentage" | "flat";
export type CustomRequestStatus =
  | "new"
  | "reviewed"
  | "in_discussion"
  | "accepted"
  | "declined";

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          slug: string;
          title: string;
          tagline: string;
          description: string;
          category: string;
          cans_count: number;
          price_paise: number;
          stock_count: number;
          is_made_to_order: boolean;
          lead_time_days: number;
          dimensions_cm: { width: number; height: number; depth: number };
          weight_grams: number;
          materials: string[];
          in_the_box: string[];
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
          tags?: string[] | null;
          custom_badge?: string | null;
          custom_chip?: string | null;
          card_tagline?: string | null;
          safety_notice?: string | null;
          object_position?: string | null;
          is_portrait?: boolean | null;
          price_prefix?: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          tagline: string;
          description: string;
          category?: string;
          cans_count: number;
          price_paise: number;
          stock_count?: number;
          is_made_to_order?: boolean;
          lead_time_days?: number;
          dimensions_cm?: { width: number; height: number; depth: number };
          weight_grams?: number;
          materials?: string[];
          in_the_box?: string[];
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          tags?: string[] | null;
          custom_badge?: string | null;
          custom_chip?: string | null;
          card_tagline?: string | null;
          safety_notice?: string | null;
          object_position?: string | null;
          is_portrait?: boolean | null;
          price_prefix?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          tagline?: string;
          description?: string;
          category?: string;
          cans_count?: number;
          price_paise?: number;
          stock_count?: number;
          is_made_to_order?: boolean;
          lead_time_days?: number;
          dimensions_cm?: { width: number; height: number; depth: number };
          weight_grams?: number;
          materials?: string[];
          in_the_box?: string[];
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          tags?: string[] | null;
          custom_badge?: string | null;
          custom_chip?: string | null;
          card_tagline?: string | null;
          safety_notice?: string | null;
          object_position?: string | null;
          is_portrait?: boolean | null;
          price_prefix?: string | null;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          label: string;
          price_paise: number;
          stock: number;
          sort: number;
          sort_order?: number;
          description_note?: string | null;
          options?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          label: string;
          price_paise: number;
          stock?: number;
          sort?: number;
          sort_order?: number;
          description_note?: string | null;
          options?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          label?: string;
          price_paise?: number;
          stock?: number;
          sort?: number;
          sort_order?: number;
          description_note?: string | null;
          options?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          alt_text: string;
          display_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          alt_text: string;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          image_url?: string;
          alt_text?: string;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          discount_type: CouponDiscountType;
          discount_value: number;
          min_order_paise: number;
          max_discount_paise: number | null;
          usage_limit: number | null;
          times_used: number;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: CouponDiscountType;
          discount_value: number;
          min_order_paise?: number;
          max_discount_paise?: number | null;
          usage_limit?: number | null;
          times_used?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: CouponDiscountType;
          discount_value?: number;
          min_order_paise?: number;
          max_discount_paise?: number | null;
          usage_limit?: number | null;
          times_used?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          status: OrderStatus;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          shipping_address_line1: string;
          shipping_address_line2: string | null;
          shipping_city: string;
          shipping_state: string;
          shipping_pincode: string;
          subtotal_paise: number;
          discount_paise: number;
          shipping_fee_paise: number;
          total_paise: number;
          coupon_id: string | null;
          payment_method: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          courier_name: string | null;
          tracking_number: string | null;
          tracking_id?: string | null;
          tracking_url: string | null;
          estimated_delivery_date: string | null;
          admin_notes: string | null;
          public_token?: string | null;
          user_id?: string | null;
          payment_status?: string | null;
          payment_meta?: Record<string, unknown> | null;
          paid_at?: string | null;
          email_sent_at?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          status?: OrderStatus;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          shipping_address_line1: string;
          shipping_address_line2?: string | null;
          shipping_city: string;
          shipping_state: string;
          shipping_pincode: string;
          subtotal_paise: number;
          discount_paise?: number;
          shipping_fee_paise?: number;
          total_paise: number;
          coupon_id?: string | null;
          payment_method?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          courier_name?: string | null;
          tracking_number?: string | null;
          tracking_id?: string | null;
          tracking_url?: string | null;
          estimated_delivery_date?: string | null;
          admin_notes?: string | null;
          public_token?: string;
          user_id?: string | null;
          payment_status?: string;
          payment_meta?: Record<string, unknown> | null;
          paid_at?: string | null;
          email_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          status?: OrderStatus;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          shipping_address_line1?: string;
          shipping_address_line2?: string | null;
          shipping_city?: string;
          shipping_state?: string;
          shipping_pincode?: string;
          subtotal_paise?: number;
          discount_paise?: number;
          shipping_fee_paise?: number;
          total_paise?: number;
          coupon_id?: string | null;
          payment_method?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          courier_name?: string | null;
          tracking_number?: string | null;
          tracking_id?: string | null;
          tracking_url?: string | null;
          estimated_delivery_date?: string | null;
          admin_notes?: string | null;
          public_token?: string;
          user_id?: string | null;
          payment_status?: string;
          payment_meta?: Record<string, unknown> | null;
          paid_at?: string | null;
          email_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_title: string;
          unit_price_paise: number;
          quantity: number;
          total_price_paise: number;
          image_url: string | null;
          variant_id?: string | null;
          variant_label?: string | null;
          selected_option?: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_title: string;
          unit_price_paise: number;
          quantity: number;
          total_price_paise: number;
          image_url?: string | null;
          variant_id?: string | null;
          variant_label?: string | null;
          selected_option?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_title?: string;
          unit_price_paise?: number;
          quantity?: number;
          total_price_paise?: number;
          image_url?: string | null;
          variant_id?: string | null;
          variant_label?: string | null;
          selected_option?: string | null;
        };
        Relationships: [];
      };
      custom_requests: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          concept_description: string;
          preferred_can_types: string | null;
          estimated_size: string | null;
          budget_inr: string | null;
          reference_image_urls: string[];
          status: CustomRequestStatus;
          admin_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone: string;
          concept_description: string;
          preferred_can_types?: string | null;
          estimated_size?: string | null;
          budget_inr?: string | null;
          reference_image_urls?: string[];
          status?: CustomRequestStatus;
          admin_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          concept_description?: string;
          preferred_can_types?: string | null;
          estimated_size?: string | null;
          budget_inr?: string | null;
          reference_image_urls?: string[];
          status?: CustomRequestStatus;
          admin_notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          phone: string | null;
          city: string | null;
          avatar_url: string | null;
          hooked_since: string | null;
          favourite_flavour: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          phone?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          hooked_since?: string | null;
          favourite_flavour?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          phone?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          hooked_since?: string | null;
          favourite_flavour?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          full_name: string;
          phone: string;
          line1: string;
          line2: string | null;
          pin: string;
          city: string;
          state: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string;
          full_name: string;
          phone: string;
          line1: string;
          line2?: string | null;
          pin: string;
          city: string;
          state: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          full_name?: string;
          phone?: string;
          line1?: string;
          line2?: string | null;
          pin?: string;
          city?: string;
          state?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decrement_stock_on_paid_order: {
        Args: { target_order_id: string };
        Returns: void;
      };
    };
    Enums: {
      order_status: OrderStatus;
      coupon_discount_type: CouponDiscountType;
      custom_request_status: CustomRequestStatus;
    };
  };
}
