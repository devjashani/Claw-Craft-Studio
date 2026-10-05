import { createAdminClient } from "@/lib/supabase/admin";
import { initialProductsFallback } from "@/lib/products";
import { Product, Order, OrderItem, Coupon } from "@/types/shop";
import { OrderStatus, CustomRequestStatus } from "@/types/database.types";
import { sendShippingUpdateEmail } from "@/lib/resend";

export interface CustomRequestItem {
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
}

export interface SiteSettingsMap {
  flat_shipping_paise: number;
  free_shipping_threshold_paise: number;
  enable_cod: boolean;
  announcement_bar_enabled: boolean;
  announcement_bar_text: string;
  whatsapp_number: string;
  admin_notification_email: string;
  business_address?: string;
  gstin?: string;
  watermark_text?: string;
}

// In-memory fallback state to preserve changes across admin actions when Supabase is in mock mode
interface AdminMockStore {
  products: Product[];
  orders: Order[];
  orderItems: Record<string, OrderItem[]>;
  coupons: Coupon[];
  customRequests: CustomRequestItem[];
  settings: SiteSettingsMap;
}

declare global {
  // eslint-disable-next-line no-var
  var __clawcraftAdminMockStore: AdminMockStore | undefined;
}

function getMockStore(): AdminMockStore {
  if (!global.__clawcraftAdminMockStore) {
    const demoOrderId = "ord-demo-001";
    global.__clawcraftAdminMockStore = {
      products: JSON.parse(JSON.stringify(initialProductsFallback)),
      orders: [
        {
          id: demoOrderId,
          order_number: "CC-2026-1042",
          status: "paid",
          customer_name: "Aarav Sharma",
          customer_email: "aarav.sharma@example.com",
          customer_phone: "9876543210",
          shipping_address_line1: "Flat 402, Skyline Residency, Indiranagar",
          shipping_address_line2: "100ft Road",
          shipping_city: "Bengaluru",
          shipping_state: "Karnataka",
          shipping_pincode: "560038",
          subtotal_paise: 229900,
          discount_paise: 0,
          shipping_fee_paise: 0,
          total_paise: 229900,
          coupon_id: null,
          payment_method: "razorpay",
          razorpay_order_id: "order_MOCK_1042",
          razorpay_payment_id: "pay_MOCK_98765",
          razorpay_signature: "mock_sig_1042",
          courier_name: "Bluedart Express",
          tracking_number: "BD88990012IN",
          tracking_url: "https://www.bluedart.com/tracking?awb=BD88990012IN",
          estimated_delivery_date: "2026-10-06",
          admin_notes: "Special packaging with dual bubblewrap requested.",
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: "ord-demo-002",
          order_number: "CC-2026-1043",
          status: "processing",
          customer_name: "Meera Patel",
          customer_email: "meera.patel@example.com",
          customer_phone: "9823456780",
          shipping_address_line1: "B-12, Silver Oak Enclave, Vastrapur",
          shipping_address_line2: null,
          shipping_city: "Ahmedabad",
          shipping_state: "Gujarat",
          shipping_pincode: "380015",
          subtotal_paise: 129900,
          discount_paise: 12990,
          shipping_fee_paise: 14900,
          total_paise: 131810,
          coupon_id: "coupon-claw10",
          payment_method: "razorpay",
          razorpay_order_id: "order_MOCK_1043",
          razorpay_payment_id: "pay_MOCK_98766",
          razorpay_signature: "mock_sig_1043",
          courier_name: null,
          tracking_number: null,
          tracking_url: null,
          estimated_delivery_date: null,
          admin_notes: "Coupon CLAW10 used.",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: "ord-demo-003",
          order_number: "CC-2026-1044",
          status: "shipped",
          customer_name: "Rohan Verma",
          customer_email: "rohan.v@example.com",
          customer_phone: "9811223344",
          shipping_address_line1: "15, Hauz Khas Village",
          shipping_address_line2: "Near Deer Park",
          shipping_city: "New Delhi",
          shipping_state: "Delhi",
          shipping_pincode: "110016",
          subtotal_paise: 489900,
          discount_paise: 0,
          shipping_fee_paise: 0,
          total_paise: 489900,
          coupon_id: null,
          payment_method: "razorpay",
          razorpay_order_id: "order_MOCK_1044",
          razorpay_payment_id: "pay_MOCK_98767",
          razorpay_signature: "mock_sig_1044",
          courier_name: "Delhivery Air",
          tracking_number: "DEL123456789",
          tracking_url: "https://www.delhivery.com/track/package/DEL123456789",
          estimated_delivery_date: "2026-10-04",
          admin_notes: "Heavy wooden internal brace added.",
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        },
      ],
      orderItems: {
        [demoOrderId]: [
          {
            id: "item-001",
            order_id: demoOrderId,
            product_id: "e1a2b3c4-0002-4000-8000-000000000002",
            product_title: "14-Can Gun Sculpture",
            unit_price_paise: 229900,
            quantity: 1,
            total_price_paise: 229900,
            image_url: "/assets/products/14-can-gun-sculpture-v2.png",
          },
        ],
        "ord-demo-002": [
          {
            id: "item-002",
            order_id: "ord-demo-002",
            product_id: "e1a2b3c4-0001-4000-8000-000000000001",
            product_title: "8-Can Gun Sculpture",
            unit_price_paise: 129900,
            quantity: 1,
            total_price_paise: 129900,
            image_url: "/assets/products/8-can-gun-sculpture-v2.png",
          },
        ],
        "ord-demo-003": [
          {
            id: "item-003",
            order_id: "ord-demo-003",
            product_id: "e1a2b3c4-0004-4000-8000-000000000004",
            product_title: "27-Can Heart Wall Art",
            unit_price_paise: 489900,
            quantity: 1,
            total_price_paise: 489900,
            image_url: "/assets/products/27-can-heart-wall-art-v2.png",
          },
        ],
      },
      coupons: [
        {
          id: "coupon-claw10",
          code: "CLAW10",
          discount_type: "percentage",
          discount_value: 10,
          min_order_paise: 99900,
          max_discount_paise: 50000,
          usage_limit: 100,
          times_used: 14,
          expires_at: "2026-12-31T23:59:59Z",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "coupon-welcome500",
          code: "STUDIO500",
          discount_type: "flat",
          discount_value: 50000, // Rs 500 off
          min_order_paise: 300000, // on orders above Rs 3,000
          max_discount_paise: null,
          usage_limit: 50,
          times_used: 6,
          expires_at: "2026-11-30T23:59:59Z",
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ],
      customRequests: [
        {
          id: "req-001",
          name: "Vikram Sengupta",
          email: "vikram@designlab.in",
          phone: "9830012345",
          concept_description:
            "Custom 50-can mechanical hawk sculpture with flared wing layout for a gaming studio reception in Kolkata.",
          preferred_can_types: "Black / Neon Green cans only",
          estimated_size: "100cm x 60cm",
          budget_inr: "Rs 15,000 - 20,000",
          reference_image_urls: [
            "/assets/products/14-can-gun-sculpture-v2.png",
          ],
          status: "in_discussion",
          admin_notes:
            "Client requested initial draft sketch before deposit.",
          created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
        },
        {
          id: "req-002",
          name: "Pooja Hegde",
          email: "pooja.h@creativehaus.com",
          phone: "9845098765",
          concept_description:
            "Giant 40-can geometric heart wall installation for an anniversary gift in Mumbai.",
          preferred_can_types: "Silver / Red / Black combo",
          estimated_size: "80cm x 80cm",
          budget_inr: "Rs 8,000",
          reference_image_urls: [],
          status: "new",
          admin_notes: null,
          created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        },
      ],
      settings: {
        flat_shipping_paise: 14900,
        free_shipping_threshold_paise: 299900,
        enable_cod: false,
        announcement_bar_enabled: true,
        announcement_bar_text:
          "HANDCRAFTED FROM CLEANED RECYCLED CANS • FREE PAN-INDIA SHIPPING ON ORDERS ABOVE ₹2,999",
        whatsapp_number: "919876543210",
        admin_notification_email: "studio@clawcraft.in",
        business_address: "",
        gstin: "",
        watermark_text: "CLAWCRAFT STUDIO",
      },
    };
  }
  return global.__clawcraftAdminMockStore;
}

// -------------------------------------------------------------
// KPI METRICS
// -------------------------------------------------------------
export async function getAdminKPIs() {
  try {
    const supabase = createAdminClient();
    const { data: orders } = await supabase.from("orders").select("total_paise, status");
    const { data: products } = await supabase.from("products").select("stock_count");

    if (orders && products) {
      const totalRevenuePaise = orders
        .filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "delivered")
        .reduce((sum, o) => sum + (o.total_paise || 0), 0);
      const pendingShipments = orders.filter(
        (o) => o.status === "paid" || o.status === "processing"
      ).length;
      const lowStockCount = products.filter((p) => p.stock_count <= 3).length;

      return {
        totalRevenuePaise,
        totalOrdersCount: orders.length,
        pendingShipmentsCount: pendingShipments,
        lowStockCount,
      };
    }
  } catch {
    // Fallback
  }

  const store = getMockStore();
  const totalRevenuePaise = store.orders
    .filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "delivered")
    .reduce((sum, o) => sum + o.total_paise, 0);
  const pendingShipmentsCount = store.orders.filter(
    (o) => o.status === "paid" || o.status === "processing"
  ).length;
  const lowStockCount = store.products.filter((p) => p.stock_count <= 3).length;

  return {
    totalRevenuePaise,
    totalOrdersCount: store.orders.length,
    pendingShipmentsCount,
    lowStockCount,
  };
}

// -------------------------------------------------------------
// PRODUCTS
// -------------------------------------------------------------
export async function getAdminProducts(): Promise<Product[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), variants:product_variants(*)")
      .order("display_order", { ascending: true });

    if (!error && data && data.length > 0) {
      return data as unknown as Product[];
    }
  } catch {
    // Fallback
  }

  const store = getMockStore();
  return store.products;
}

export async function getAdminProductById(id: string): Promise<Product | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), variants:product_variants(*)")
      .eq("id", id)
      .single();

    if (!error && data) {
      return data as unknown as Product;
    }
  } catch {
    // Fallback
  }

  const store = getMockStore();
  return store.products.find((p) => p.id === id) || null;
}

export async function saveAdminProduct(
  productData: Partial<Product> & { title: string; price_paise: number }
): Promise<Product> {
  const store = getMockStore();
  const slug =
    productData.slug ||
    productData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const fullPayload: Product = {
    id: productData.id || `prod-${Date.now()}`,
    slug,
    title: productData.title,
    tagline: productData.tagline || "Handcrafted display piece from recycled cans.",
    description: productData.description || "Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.",
    category: productData.category || "sculptures",
    cans_count: productData.cans_count ?? 8,
    price_paise: productData.price_paise,
    stock_count: productData.stock_count ?? 5,
    is_made_to_order: productData.is_made_to_order ?? false,
    lead_time_days: productData.lead_time_days ?? 3,
    dimensions_cm: productData.dimensions_cm || { width: 30, height: 20, depth: 8 },
    weight_grams: productData.weight_grams ?? 500,
    materials: productData.materials || [
      "Cleaned Aluminum Energy-Drink Cans",
      "Industrial Rivets",
      "Structural Polymer",
    ],
    in_the_box: productData.in_the_box || [
      "Handcrafted Can Sculpture",
      "Certificate of Authenticity",
      "Studio Sticker Pack",
    ],
    variants: productData.variants || [],
    is_active: productData.is_active ?? true,
    display_order: productData.display_order ?? store.products.length + 1,
    created_at: productData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createAdminClient();
    if (productData.id && store.products.some((p) => p.id === productData.id)) {
      await supabase.from("products").update(fullPayload as any).eq("id", productData.id);
    } else {
      await supabase.from("products").insert(fullPayload as any);
    }

    if (fullPayload.variants && fullPayload.variants.length > 0) {
      for (const variant of fullPayload.variants) {
        const variantPayload = {
          id: variant.id || `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          product_id: fullPayload.id,
          label: variant.label,
          price_paise: variant.price_paise,
          stock: variant.stock,
          sort_order: variant.sort_order ?? 1,
          options: variant.options || null,
        };
        await supabase.from("product_variants").upsert(variantPayload as any);
      }
    }
  } catch {
    // Fallback
  }

  // Update in mock store
  const existingIdx = store.products.findIndex((p) => p.id === fullPayload.id);
  if (existingIdx >= 0) {
    store.products[existingIdx] = fullPayload;
  } else {
    store.products.push(fullPayload);
  }

  return fullPayload;
}

export async function updateVariantStock(
  productId: string,
  variantId: string,
  newStock: number
): Promise<boolean> {
  const stock = Math.max(0, newStock);
  try {
    const supabase = createAdminClient();
    await supabase
      .from("product_variants")
      .update({ stock: stock } as any)
      .eq("id", variantId);
  } catch {
    // ignore
  }

  const store = getMockStore();
  const prod = store.products.find((p) => p.id === productId);
  if (prod && prod.variants) {
    const v = prod.variants.find((item) => item.id === variantId);
    if (v) {
      v.stock = stock;
    }
  }
  return true;
}

export async function deleteAdminProduct(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    await supabase.from("products").delete().eq("id", id);
  } catch {
    // ignore
  }

  const store = getMockStore();
  store.products = store.products.filter((p) => p.id !== id);
  return true;
}

export async function updateProductStock(id: string, newStock: number): Promise<boolean> {
  const stock = Math.max(0, newStock);
  try {
    const supabase = createAdminClient();
    await supabase.from("products").update({ stock_count: stock } as any).eq("id", id);
  } catch {
    // ignore
  }

  const store = getMockStore();
  const prod = store.products.find((p) => p.id === id);
  if (prod) {
    prod.stock_count = stock;
    prod.updated_at = new Date().toISOString();
  }
  return true;
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    await supabase.from("products").update({ is_active: isActive } as any).eq("id", id);
  } catch {
    // ignore
  }

  const store = getMockStore();
  const prod = store.products.find((p) => p.id === id);
  if (prod) {
    prod.is_active = isActive;
    prod.updated_at = new Date().toISOString();
  }
  return true;
}

// -------------------------------------------------------------
// ORDERS
// -------------------------------------------------------------
export async function getAdminOrders(statusFilter?: string): Promise<Order[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter as OrderStatus);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as unknown as Order[];
    }
  } catch {
    // Fallback
  }

  const store = getMockStore();
  if (statusFilter && statusFilter !== "all") {
    return store.orders.filter((o) => o.status === statusFilter);
  }
  return store.orders;
}

export async function getAdminOrderById(
  id: string
): Promise<{ order: Order | null; items: OrderItem[] }> {
  let order: Order | null = null;
  let items: OrderItem[] = [];

  try {
    const supabase = createAdminClient();
    const { data: dbOrder } = await supabase.from("orders").select("*").eq("id", id).single();
    if (dbOrder) {
      order = dbOrder as unknown as Order;
      const { data: dbItems } = await supabase.from("order_items").select("*").eq("order_id", id);
      items = (dbItems as unknown as OrderItem[]) || [];
      return { order, items };
    }
  } catch {
    // Fallback
  }

  const store = getMockStore();
  order = store.orders.find((o) => o.id === id) || null;
  items = order ? store.orderItems[order.id] || [] : [];
  return { order, items };
}

export async function updateAdminOrder({
  id,
  status,
  courier_name,
  tracking_number,
  tracking_url,
  estimated_delivery_date,
  admin_notes,
  notify_customer = false,
}: {
  id: string;
  status?: OrderStatus;
  courier_name?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  estimated_delivery_date?: string | null;
  admin_notes?: string | null;
  notify_customer?: boolean;
}): Promise<Order | null> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (status !== undefined) updates.status = status;
  if (courier_name !== undefined) updates.courier_name = courier_name;
  if (tracking_number !== undefined) updates.tracking_number = tracking_number;
  if (tracking_url !== undefined) updates.tracking_url = tracking_url;
  if (estimated_delivery_date !== undefined) updates.estimated_delivery_date = estimated_delivery_date;
  if (admin_notes !== undefined) updates.admin_notes = admin_notes;

  try {
    const supabase = createAdminClient();
    await supabase.from("orders").update(updates as any).eq("id", id);
  } catch {
    // ignore
  }

  const store = getMockStore();
  const order = store.orders.find((o) => o.id === id);
  if (order) {
    Object.assign(order, updates);
  }

  if (notify_customer && order && courier_name && tracking_number) {
    await sendShippingUpdateEmail({
      order,
      courierName: courier_name,
      trackingNumber: tracking_number,
      trackingUrl: tracking_url,
    });
  }

  return order || null;
}

// -------------------------------------------------------------
// COUPONS
// -------------------------------------------------------------
export async function getAdminCoupons(): Promise<Coupon[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as unknown as Coupon[];
    }
  } catch {
    // Fallback
  }

  const store = getMockStore();
  return store.coupons;
}

export async function saveAdminCoupon(couponData: Partial<Coupon> & { code: string; discount_value: number }): Promise<Coupon> {
  const code = couponData.code.trim().toUpperCase();
  const fullCoupon: Coupon = {
    id: couponData.id || `coupon-${Date.now()}`,
    code,
    discount_type: couponData.discount_type || "percentage",
    discount_value: couponData.discount_value,
    min_order_paise: couponData.min_order_paise || 0,
    max_discount_paise: couponData.max_discount_paise ?? null,
    usage_limit: couponData.usage_limit ?? null,
    times_used: couponData.times_used ?? 0,
    expires_at: couponData.expires_at ?? null,
    is_active: couponData.is_active ?? true,
    created_at: couponData.created_at || new Date().toISOString(),
  };

  try {
    const supabase = createAdminClient();
    if (couponData.id) {
      await supabase.from("coupons").update(fullCoupon as any).eq("id", couponData.id);
    } else {
      await supabase.from("coupons").insert(fullCoupon as any);
    }
  } catch {
    // ignore
  }

  const store = getMockStore();
  const idx = store.coupons.findIndex((c) => c.id === fullCoupon.id);
  if (idx >= 0) {
    store.coupons[idx] = fullCoupon;
  } else {
    store.coupons.unshift(fullCoupon);
  }

  return fullCoupon;
}

export async function deleteAdminCoupon(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    await supabase.from("coupons").delete().eq("id", id);
  } catch {
    // ignore
  }

  const store = getMockStore();
  store.coupons = store.coupons.filter((c) => c.id !== id);
  return true;
}

export async function toggleCouponActive(id: string, isActive: boolean): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    await supabase.from("coupons").update({ is_active: isActive } as any).eq("id", id);
  } catch {
    // ignore
  }

  const store = getMockStore();
  const c = store.coupons.find((c) => c.id === id);
  if (c) {
    c.is_active = isActive;
  }
  return true;
}

// -------------------------------------------------------------
// CUSTOM REQUESTS
// -------------------------------------------------------------
export async function getAdminCustomRequests(): Promise<CustomRequestItem[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("custom_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as unknown as CustomRequestItem[];
    }
  } catch {
    // Fallback
  }

  const store = getMockStore();
  return store.customRequests;
}

export async function updateAdminCustomRequestStatus(
  id: string,
  status: CustomRequestStatus,
  adminNotes?: string | null
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const payload: Record<string, unknown> = { status };
    if (adminNotes !== undefined) payload.admin_notes = adminNotes;
    await supabase.from("custom_requests").update(payload as any).eq("id", id);
  } catch {
    // ignore
  }

  const store = getMockStore();
  const item = store.customRequests.find((r) => r.id === id);
  if (item) {
    item.status = status;
    if (adminNotes !== undefined) item.admin_notes = adminNotes;
  }
  return true;
}

// -------------------------------------------------------------
// SITE SETTINGS
// -------------------------------------------------------------
export async function getAdminSettings(): Promise<SiteSettingsMap> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("site_settings").select("*");
    if (data && data.length > 0) {
      const store = getMockStore();
      const mapped = { ...store.settings };
      for (const row of data) {
        if (row.key in mapped) {
          (mapped as any)[row.key] = row.value;
        }
      }
      return mapped;
    }
  } catch {
    // Fallback
  }

  const store = getMockStore();
  return store.settings;
}

export async function saveAdminSettings(settings: Partial<SiteSettingsMap>): Promise<SiteSettingsMap> {
  const store = getMockStore();
  Object.assign(store.settings, settings);

  try {
    const supabase = createAdminClient();
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from("site_settings").upsert({
        key,
        value: value as any,
        updated_at: new Date().toISOString(),
      });
    }
  } catch {
    // ignore
  }

  return store.settings;
}
