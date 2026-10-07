import { createAdminClient, sanitizeSupabaseUrl, sanitizeSupabaseKey } from "@/lib/supabase/admin";
import { Order, OrderItem } from "@/types/shop";
import { safeCompareTokens, generatePublicToken } from "@/lib/orders/order-crypto";

export interface CreateOrderInputItem {
  id: string;
  productId: string;
  slug: string;
  title: string;
  pricePaise: number;
  quantity: number;
  imageUrl?: string | null;
  variantId?: string | null;
  variantLabel?: string | null;
  selectedOption?: string | null;
}

export interface CreateOrderInput {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: string;
  items: CreateOrderInputItem[];
  subtotalPaise: number;
  discountPaise: number;
  shippingFeePaise: number;
  totalPaise: number;
  couponId?: string | null;
  couponCode?: string | null;
  isPaid?: boolean;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  paymentMeta?: Record<string, unknown>;
  userId?: string | null;
}

export interface OrderLookupResult {
  order: Order | null;
  items: OrderItem[];
  isDemo: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __clawcraftDemoOrdersStore: Record<string, { order: Order; items: OrderItem[] }> | undefined;
}

function getMemoryDemoStore(): Record<string, { order: Order; items: OrderItem[] }> {
  if (!global.__clawcraftDemoOrdersStore) {
    global.__clawcraftDemoOrdersStore = {};
  }
  return global.__clawcraftDemoOrdersStore;
}

/**
 * Checks if Supabase connection credentials are real and present
 */
export function isSupabaseConfigured(): boolean {
  const url = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !key) return false;
  if (url.includes("placeholder") || key.includes("placeholder")) return false;
  if (url.includes("mock-project") || key.includes("mock")) return false;
  return true;
}

/**
 * Demo mode is permitted ONLY if Supabase is not configured AND NODE_ENV is not production,
 * or if explicitly enabled via DEMO_MODE=true env.
 */
export function isDemoModeAllowed(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (!isSupabaseConfigured() && process.env.NODE_ENV !== "production") return true;
  return false;
}

/**
 * Store a demo order in memory and localStorage (client-side)
 */
export function saveDemoOrder(order: Order, items: OrderItem[]): void {
  // 1. In-memory store (serverless / Node / test scripts)
  const memStore = getMemoryDemoStore();
  const entry = { order: { ...order, isDemo: true }, items };
  memStore[order.id] = entry;
  memStore[order.order_number] = entry;
  if (order.public_token) {
    memStore[order.public_token] = entry;
  }

  // 2. LocalStorage (client-side browser)
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = window.localStorage.getItem("clawcraft_demo_orders");
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      existing[order.id] = entry;
      existing[order.order_number] = entry;
      if (order.public_token) {
        existing[order.public_token] = entry;
      }
      window.localStorage.setItem("clawcraft_demo_orders", JSON.stringify(existing));
    } catch {
      // localStorage may be disabled or quota exceeded
    }
  }
}

/**
 * Retrieve demo order from localStorage or memory store
 */
export function getDemoOrder(idOrToken: string): { order: Order; items: OrderItem[] } | null {
  const key = idOrToken.trim();

  // Try localStorage first if in browser
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem("clawcraft_demo_orders");
      if (raw) {
        const store = JSON.parse(raw);
        if (store[key]) return store[key];
        // Scan by order_number or public_token
        for (const entry of Object.values(store) as any[]) {
          if (
            entry.order?.id === key ||
            entry.order?.order_number === key ||
            entry.order?.public_token === key
          ) {
            return entry;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Check in-memory store
  const memStore = getMemoryDemoStore();
  if (memStore[key]) return memStore[key];
  for (const entry of Object.values(memStore)) {
    if (
      entry.order?.id === key ||
      entry.order?.order_number === key ||
      entry.order?.public_token === key
    ) {
      return entry;
    }
  }

  return null;
}

/**
 * Get next demo sequential order number
 */
function getNextDemoOrderNumber(): string {
  let counter = 1;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const current = window.localStorage.getItem("clawcraft_demo_counter");
      if (current) counter = parseInt(current, 10) + 1;
      window.localStorage.setItem("clawcraft_demo_counter", String(counter));
    } catch {
      counter = Math.floor(1000 + Math.random() * 9000);
    }
  } else {
    counter = Object.keys(getMemoryDemoStore()).length + 1;
  }
  return `CC-DEMO-${String(counter).padStart(4, "0")}`;
}

function generateDemoOrderResult(input: CreateOrderInput) {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const demoId = `demo-${Date.now().toString(36)}-${randomSuffix}`;
  const demoOrderNumber = getNextDemoOrderNumber();
  const demoPublicToken = `demo_tok_${generatePublicToken()}`;
  const nowIso = new Date().toISOString();

  const isCod = input.paymentMethod === "cod";
  const status = input.isPaid ? "paid" : isCod ? "processing" : "pending_payment";
  const paymentStatus = input.isPaid ? "paid" : isCod ? "pending_payment" : "pending_payment";

  const demoOrder: Order = {
    id: demoId,
    order_number: demoOrderNumber,
    status,
    customer_name: input.name.trim(),
    customer_email: input.email.trim(),
    customer_phone: input.phone.trim(),
    shipping_address_line1: input.addressLine1.trim(),
    shipping_address_line2: input.addressLine2 ? input.addressLine2.trim() : null,
    shipping_city: input.city.trim(),
    shipping_state: input.state.trim(),
    shipping_pincode: input.pincode.trim(),
    subtotal_paise: input.subtotalPaise,
    discount_paise: input.discountPaise,
    shipping_fee_paise: input.shippingFeePaise,
    total_paise: input.totalPaise,
    coupon_id: input.couponId || null,
    payment_method: input.paymentMethod,
    razorpay_order_id: input.razorpayOrderId || (isCod ? null : `order_demo_${randomSuffix}`),
    razorpay_payment_id: input.razorpayPaymentId || (input.isPaid ? `pay_demo_${randomSuffix}` : null),
    razorpay_signature: input.isPaid ? `sig_demo_${randomSuffix}` : null,
    courier_name: null,
    tracking_number: null,
    tracking_id: null,
    tracking_url: null,
    estimated_delivery_date: null,
    admin_notes: null,
    public_token: demoPublicToken,
    payment_status: paymentStatus,
    payment_meta: input.paymentMeta || { method: input.paymentMethod, demo: true },
    paid_at: input.isPaid ? nowIso : null,
    email_sent_at: null,
    user_id: input.userId || null,
    created_at: nowIso,
    updated_at: nowIso,
    isDemo: true,
  };

  const demoItems: OrderItem[] = input.items.map((item, idx) => ({
    id: `item-demo-${idx + 1}-${randomSuffix}`,
    order_id: demoId,
    product_id: item.productId,
    product_title: item.title,
    unit_price_paise: item.pricePaise,
    quantity: item.quantity,
    total_price_paise: item.pricePaise * item.quantity,
    image_url: item.imageUrl || null,
    variant_id: item.variantId || null,
    variant_label: item.variantLabel || null,
    selected_option: item.selectedOption || null,
  }));

  saveDemoOrder(demoOrder, demoItems);

  return {
    success: true,
    order: demoOrder,
    items: demoItems,
    orderId: demoOrder.id,
    orderNumber: demoOrder.order_number,
    publicToken: demoOrder.public_token || undefined,
    isDemo: true,
  };
}

/**
 * Create Order in single data layer:
 * - Supabase adapter (production / connected)
 * - Demo adapter (fallback ONLY when offline in dev or DEMO_MODE=true)
 */
export async function createOrder(input: CreateOrderInput): Promise<{
  success: boolean;
  order?: Order;
  items?: OrderItem[];
  orderId?: string;
  orderNumber?: string;
  publicToken?: string;
  isDemo?: boolean;
  error?: string;
}> {
  const supabaseReady = isSupabaseConfigured();

  // Guard: If in production without Supabase, block checkout
  if (!supabaseReady) {
    if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "true") {
      return {
        success: false,
        error: "Store is not connected. Database is currently unavailable.",
      };
    }

    if (!isDemoModeAllowed()) {
      return {
        success: false,
        error: "Store is not connected. Please contact studio support.",
      };
    }

    // Demo Mode Adapter
    return generateDemoOrderResult(input);
  }

  // Supabase Adapter
  try {
    const supabase = createAdminClient();
    const publicToken = generatePublicToken();
    const isCod = input.paymentMethod === "cod";
    const initialStatus = input.isPaid ? "paid" : isCod ? "processing" : "pending_payment";
    const initialPaymentStatus = input.isPaid ? "paid" : "pending_payment";
    const nowIso = new Date().toISOString();

    const orderPayload: any = {
      status: initialStatus,
      customer_name: input.name.trim(),
      customer_email: input.email.trim(),
      customer_phone: input.phone.trim(),
      shipping_address_line1: input.addressLine1.trim(),
      shipping_address_line2: input.addressLine2 ? input.addressLine2.trim() : null,
      shipping_city: input.city.trim(),
      shipping_state: input.state.trim(),
      shipping_pincode: input.pincode.trim(),
      subtotal_paise: input.subtotalPaise,
      discount_paise: input.discountPaise,
      shipping_fee_paise: input.shippingFeePaise,
      total_paise: input.totalPaise,
      coupon_id: input.couponId || null,
      payment_method: input.paymentMethod,
      razorpay_order_id: input.razorpayOrderId || null,
      razorpay_payment_id: input.razorpayPaymentId || null,
      public_token: publicToken,
      payment_status: initialPaymentStatus,
      payment_meta: input.paymentMeta || {},
      paid_at: input.isPaid ? nowIso : null,
      user_id: input.userId || null,
    };

    const { data: dbOrder, error: orderError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select()
      .single();

    if (orderError || !dbOrder) {
      console.error("[Supabase createOrder Error]", orderError);
      if (process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true") {
        console.warn("[createOrder] Supabase insert failed in dev, falling back to Demo Mode:", orderError?.message);
        return generateDemoOrderResult(input);
      }
      return { success: false, error: orderError?.message || "Failed to create order in database." };
    }

    const createdOrder = dbOrder as unknown as Order;

    // Insert order items
    const orderItemsPayload = input.items.map((item) => ({
      order_id: createdOrder.id,
      product_id: item.productId,
      product_title: item.title,
      unit_price_paise: item.pricePaise,
      quantity: item.quantity,
      total_price_paise: item.pricePaise * item.quantity,
      image_url: item.imageUrl || null,
      variant_id: item.variantId || null,
      variant_label: item.variantLabel || null,
      selected_option: item.selectedOption || null,
    }));

    const { data: dbItems, error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload as any)
      .select();

    if (itemsError) {
      console.error("[Supabase insert order_items Error]", itemsError);
    }

    return {
      success: true,
      order: createdOrder,
      items: (dbItems as unknown as OrderItem[]) || [],
      orderId: createdOrder.id,
      orderNumber: createdOrder.order_number,
      publicToken: createdOrder.public_token || undefined,
      isDemo: false,
    };
  } catch (err: any) {
    console.error("[createOrder Exception]", err);
    if (process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true") {
      console.warn("[createOrder] Supabase connection failed in dev, falling back to Demo Mode:", err?.message);
      return generateDemoOrderResult(input);
    }
    return { success: false, error: err?.message || "Failed to process order." };
  }
}

/**
 * Fetch Order and its items from Supabase or Demo store
 */
export async function getOrder(
  idOrToken: string,
  options?: { phone?: string; token?: string; bypassAccessCheck?: boolean }
): Promise<OrderLookupResult> {
  const cleanId = idOrToken.trim();

  // 1. Check Demo store if idOrToken is a demo order or Supabase is not ready
  if (cleanId.startsWith("demo-") || cleanId.startsWith("CC-DEMO-") || cleanId.startsWith("demo_tok_")) {
    const demo = getDemoOrder(cleanId);
    if (demo) {
      return { order: demo.order, items: demo.items, isDemo: true };
    }
  }

  // 2. Fetch from Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      let query = supabase.from("orders").select("*");

      if (cleanId.includes("-") && cleanId.length === 36) {
        // UUID format
        query = query.eq("id", cleanId);
      } else if (cleanId.startsWith("CC-")) {
        // Order Number format
        query = query.eq("order_number", cleanId);
      } else {
        // Search by id, order_number, or public_token
        query = query.or(`id.eq.${cleanId},order_number.eq.${cleanId},public_token.eq.${cleanId}`);
      }

      const { data: dbOrder, error } = await query.maybeSingle();

      if (!error && dbOrder) {
        const order = dbOrder as unknown as Order;
        const { data: dbItems } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);

        return {
          order,
          items: (dbItems as unknown as OrderItem[]) || [],
          isDemo: false,
        };
      }
    } catch (err) {
      console.warn("[getOrder Supabase Exception]", err);
    }
  }

  // 3. Fallback check demo store in case of dev mode
  const fallbackDemo = getDemoOrder(cleanId);
  if (fallbackDemo) {
    return { order: fallbackDemo.order, items: fallbackDemo.items, isDemo: true };
  }

  return { order: null, items: [], isDemo: false };
}

/**
 * Verify access permission for an order:
 * - Admin logged in -> ALWAYS ALLOWED
 * - Valid public_token query param (`?t=...`) matching order.public_token via constant-time comparison -> ALLOWED
 * - Phone number matching customer_phone (last 4 or full 10 digits) -> ALLOWED
 */
export function verifyOrderAccess(
  order: Order,
  token?: string | null,
  phone?: string | null,
  isAdmin?: boolean,
  userId?: string | null
): { allowed: boolean; reason?: string } {
  if (isAdmin) return { allowed: true };

  // Check if authenticated user owns the order
  if (userId && (order as any).user_id && (order as any).user_id === userId) {
    return { allowed: true };
  }

  // Check constant-time token comparison
  if (token && order.public_token && safeCompareTokens(order.public_token, token)) {
    return { allowed: true };
  }

  // Check phone number match
  if (phone && order.customer_phone) {
    const cleanInput = phone.replace(/[^0-9]/g, "");
    const cleanOrder = order.customer_phone.replace(/[^0-9]/g, "");
    if (
      cleanInput.length >= 4 &&
      (cleanOrder.endsWith(cleanInput) || cleanInput.endsWith(cleanOrder))
    ) {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: "Invalid token or phone number does not match order record." };
}
