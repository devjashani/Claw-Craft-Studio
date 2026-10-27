import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getRazorpayClient,
  validateRazorpayEnvironment,
  isPaymentSimulationAllowed,
  isProductionPaymentEnv,
} from "@/lib/razorpay";
import { getProducts, getProductImageUrl } from "@/lib/products";
import { checkoutFormSchema } from "@/lib/validation/checkout";
import { Coupon, Order, OrderItem } from "@/types/shop";
import { createOrder, CreateOrderInputItem } from "@/lib/orders/order-service";
import {
  sendAdminPaymentAlertEmail,
  sendCustomerCodOrderEmail,
  sendAdminCodOrderAlertEmail,
} from "@/lib/resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSiteHost } from "@/lib/site";
import { getAdminSettings } from "@/lib/admin/admin-data";
import {
  checkIsLocalDeliveryPincode,
  calculateShippingFeeServer,
} from "@/lib/settings/shipping-promo";

export const dynamic = "force-dynamic";

interface CheckoutItemPayload {
  id: string;
  productId?: string;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
  selectedOption?: string;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting per IP
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous-client";

    const rateCheck = checkRateLimit(`checkout-create-${clientIp}`, 15, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    // 2. Origin / Host verification
    const origin = req.headers.get("origin") || req.headers.get("referer");
    const configuredHost = getSiteHost();
    if (origin && configuredHost && isProductionPaymentEnv()) {
      try {
        const originUrl = new URL(origin);
        if (
          originUrl.host.toLowerCase() !== configuredHost.toLowerCase() &&
          !originUrl.host.toLowerCase().endsWith(`.${configuredHost.toLowerCase()}`)
        ) {
          console.warn(`[Checkout Origin Mismatch] Received origin ${originUrl.host}, expected ${configuredHost}`);
        }
      } catch {
        // ignore parse errors
      }
    }

    const body = await req.json();
    const { items, formValues } = body as {
      items: CheckoutItemPayload[];
      formValues: unknown;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty. Please select products first." },
        { status: 400 }
      );
    }

    // 3. Validate Form Values with Zod
    const validationResult = checkoutFormSchema.safeParse(formValues);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || "Invalid checkout details.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = validationResult.data;
    const isCod = data.paymentMethod === "cod";

    // 4. SERVER-SIDE PRICE & INVENTORY RECALCULATION (NEVER trust client amounts)
    const catalog = await getProducts();
    const orderItemsToInsert: Array<{
      product_id: string;
      product_title: string;
      variant_id?: string | null;
      variant_label?: string | null;
      selected_option?: string | null;
      unit_price_paise: number;
      quantity: number;
      total_price_paise: number;
      image_url: string;
    }> = [];

    let calculatedSubtotalPaise = 0;

    for (const item of items) {
      const targetProductId = item.productId || item.id;
      const dbProduct = catalog.find(
        (p) => p.id === targetProductId || p.slug === targetProductId
      );
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product not found in catalog (ID: ${targetProductId}).` },
          { status: 400 }
        );
      }

      const qty = Math.max(1, Math.floor(item.quantity));

      // Validate Inventory
      if (!dbProduct.is_made_to_order && typeof dbProduct.stock_count === "number") {
        if (dbProduct.stock_count < qty) {
          return NextResponse.json(
            {
              error: `"${dbProduct.title}" has insufficient stock available (${dbProduct.stock_count} remaining). Please adjust your cart.`,
            },
            { status: 400 }
          );
        }
      }

      // Recompute price strictly from database variant if specified
      let unitPricePaise = dbProduct.price_paise;
      let variantLabel = item.variantLabel || null;
      let variantId = item.variantId || null;

      if (variantId && dbProduct.variants && dbProduct.variants.length > 0) {
        const foundVariant = dbProduct.variants.find((v) => v.id === variantId);
        if (foundVariant) {
          unitPricePaise = foundVariant.price_paise;
          variantLabel = foundVariant.label;
          if (typeof foundVariant.stock === "number" && foundVariant.stock < qty) {
            return NextResponse.json(
              {
                error: `Selected option for "${dbProduct.title}" has only ${foundVariant.stock} items left in stock.`,
              },
              { status: 400 }
            );
          }
        }
      }

      const lineTotal = unitPricePaise * qty;
      calculatedSubtotalPaise += lineTotal;

      orderItemsToInsert.push({
        product_id: dbProduct.id,
        product_title: dbProduct.title,
        variant_id: variantId,
        variant_label: variantLabel,
        selected_option: item.selectedOption || null,
        unit_price_paise: unitPricePaise,
        quantity: qty,
        total_price_paise: lineTotal,
        image_url: getProductImageUrl(dbProduct.slug),
      });
    }

    // 5. Coupon Validation & Discount
    let calculatedDiscountPaise = 0;
    let validCouponId: string | null = null;

    if (data.couponCode && data.couponCode.trim()) {
      const cleanCode = data.couponCode.trim().toUpperCase();
      try {
        const supabase = createAdminClient();
        const { data: dbCoupon } = await supabase
          .from("coupons")
          .select("*")
          .eq("code", cleanCode)
          .eq("is_active", true)
          .single();

        const coupon = dbCoupon as Coupon | null;

        if (
          coupon &&
          (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) &&
          calculatedSubtotalPaise >= coupon.min_order_paise
        ) {
          validCouponId = coupon.id;
          if (coupon.discount_type === "percentage") {
            calculatedDiscountPaise = Math.round(
              (calculatedSubtotalPaise * coupon.discount_value) / 100
            );
            if (coupon.max_discount_paise) {
              calculatedDiscountPaise = Math.min(
                calculatedDiscountPaise,
                coupon.max_discount_paise
              );
            }
          } else {
            calculatedDiscountPaise = coupon.discount_value;
          }
        }
      } catch {
        // Fallback for default studio promo code
        if (cleanCode === "CLAW10" && calculatedSubtotalPaise >= 100000) {
          calculatedDiscountPaise = Math.round(calculatedSubtotalPaise * 0.1);
        }
      }
    }

    // 6. Fetch Studio Settings & Delivery Mode
    const settings = await getAdminSettings();
    const isLocal = await checkIsLocalDeliveryPincode(data.pincode);
    const deliveryMode: "local" | "courier" = isLocal ? "local" : "courier";

    // 7. Calculate Server Shipping Fee (Promo-aware, never trusting client)
    const shippingFeePaise = calculateShippingFeeServer(
      calculatedSubtotalPaise,
      deliveryMode,
      settings
    );

    // 8. Handle Cash on Delivery (COD) Validation (Strictly enforced on SERVER)
    let codFeePaise = 0;
    let calculatedTotalPaise = 0;

    if (isCod) {
      // (a) Must be enabled in settings
      if (!settings.cod_enabled && !settings.enable_cod) {
        return NextResponse.json(
          { error: "Sorry, Cash on Delivery is not available at your address. Please pay online." },
          { status: 400 }
        );
      }

      // (b) Must be in active local Jaipur PIN code list
      if (deliveryMode !== "local") {
        return NextResponse.json(
          { error: "Sorry, Cash on Delivery is not available at your address. Please pay online." },
          { status: 400 }
        );
      }

      // (c) Calculate COD fee
      codFeePaise = Math.max(0, Math.round((Number(settings.cod_fee_inr) || 0) * 100));

      // (d) Final Recomputed Total with COD fee
      calculatedTotalPaise = Math.max(
        0,
        calculatedSubtotalPaise - calculatedDiscountPaise + shippingFeePaise + codFeePaise
      );

      // (e) Must be within max order value limit
      const maxCodPaise = (Number(settings.cod_max_order_value_inr) || 5000) * 100;
      if (calculatedTotalPaise > maxCodPaise) {
        return NextResponse.json(
          { error: "Sorry, Cash on Delivery is not available at your address. Please pay online." },
          { status: 400 }
        );
      }

      // (f) Phone number blocked check
      const cleanPhone = data.phone.replace(/\D/g, "");
      const rawBlocked = settings.cod_blocked_phones;
      const blockedList: string[] = Array.isArray(rawBlocked)
        ? rawBlocked
        : typeof rawBlocked === "string"
        ? (rawBlocked as string).split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
        : [];
      const isBlocked = blockedList.some((bp) => {
        const cleanBp = bp.replace(/\D/g, "");
        return cleanBp && (cleanPhone.endsWith(cleanBp) || cleanBp.endsWith(cleanPhone));
      });
      if (isBlocked) {
        return NextResponse.json(
          { error: "Sorry, Cash on Delivery is not available at your address. Please pay online." },
          { status: 400 }
        );
      }

      // (g) Check max open COD orders per phone
      const maxOpen = Number(settings.cod_max_open_orders_per_phone) || 2;
      try {
        const supabase = createAdminClient();
        const last10Phone = cleanPhone.slice(-10);
        const { count } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("payment_method", "cod")
          .in("status", ["awaiting_confirmation", "confirmed", "out_for_delivery"])
          .ilike("customer_phone", `%${last10Phone}%`);
        if (typeof count === "number" && count >= maxOpen) {
          return NextResponse.json(
            {
              error: `You have reached the maximum of ${maxOpen} open Pay on Delivery orders. Please pay online or wait for current orders to be delivered.`,
            },
            { status: 400 }
          );
        }
      } catch (openErr) {
        console.warn("[COD open orders check warning]:", openErr);
      }

      // (h) Per-phone rate limit
      const phoneRateCheck = checkRateLimit(`checkout-phone-${cleanPhone}`, 5, 60 * 1000);
      if (!phoneRateCheck.success) {
        return NextResponse.json(
          { error: "Too many orders attempted from this phone number. Please wait a moment and try again." },
          { status: 429 }
        );
      }
    } else {
      codFeePaise = 0;
      // For online Razorpay orders: enforce minimum payable amount of Rs 1 (100 paise)
      calculatedTotalPaise = Math.max(
        100,
        calculatedSubtotalPaise - calculatedDiscountPaise + shippingFeePaise
      );
    }

    // 9. KEY MODE GUARD & ENVIRONMENT VALIDATION (for Online Razorpay Orders)
    const hostHeader = req.headers.get("host");
    const simulationAllowed = isPaymentSimulationAllowed(hostHeader);
    let isDevSimulatedOrder = false;

    if (!isCod) {
      const envGuard = validateRazorpayEnvironment();
      if (!envGuard.isValid) {
        // Check if dev simulation is strictly allowed
        if (simulationAllowed) {
          isDevSimulatedOrder = true;
          console.warn(
            "[DEV Payment Simulation] Explicit developer simulation enabled on localhost with ALLOW_PAYMENT_SIMULATION=true."
          );
        } else {
          // In production or when simulation is not permitted:
          console.error(envGuard.adminLogMessage);

          if (isProductionPaymentEnv()) {
            // Alert owner through notifier in production
            await sendAdminPaymentAlertEmail({
              subject: `Checkout Blocked: ${envGuard.errorType}`,
              message: envGuard.adminLogMessage,
            });
          }

          return NextResponse.json(
            { error: envGuard.customerMessage },
            { status: 503 }
          );
        }
      }
    }

    // 10. Extract authenticated user session server-side (NEVER from client body)
    let authenticatedUserId: string | null = null;
    try {
      const userSupabase = createClient();
      const { data: authData } = await userSupabase.auth.getUser();
      if (authData?.user?.id) {
        authenticatedUserId = authData.user.id;
      }
    } catch {
      // Guest order
    }

    // 11. Create Order via Order Service
    const orderItemsForCreate: CreateOrderInputItem[] = orderItemsToInsert.map(
      (item, idx) => ({
        id: `item-${idx}`,
        productId: item.product_id,
        slug: "",
        title: item.product_title,
        pricePaise: item.unit_price_paise,
        quantity: item.quantity,
        imageUrl: item.image_url,
        variantId: item.variant_id,
        variantLabel: item.variant_label,
        selectedOption: item.selected_option,
      })
    );

    const orderResult = await createOrder({
      name: data.name,
      email: data.email,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      paymentMethod: data.paymentMethod,
      items: orderItemsForCreate,
      subtotalPaise: calculatedSubtotalPaise,
      discountPaise: calculatedDiscountPaise,
      shippingFeePaise,
      codFeePaise,
      totalPaise: calculatedTotalPaise,
      couponId: validCouponId,
      couponCode: data.couponCode,
      userId: authenticatedUserId,
      isPaid: false, // NEVER mark paid at creation
      deliveryMode,
    });

    if (!orderResult.success || !orderResult.order) {
      return NextResponse.json(
        { error: orderResult.error || "Store is not connected. Database is currently unavailable." },
        { status: 503 }
      );
    }

    const createdOrder = orderResult.order;
    const finalOrderId = createdOrder.id;
    const orderNumber = createdOrder.order_number;
    const publicToken = createdOrder.public_token;

    // 12. Create Real Razorpay Order via SDK for online orders OR trigger COD notifications
    let razorpayOrderId: string | null = null;

    if (!isCod) {
      if (isDevSimulatedOrder) {
        // ONLY in localhost dev with explicit ALLOW_PAYMENT_SIMULATION=true
        razorpayOrderId = `order_sim_${Math.random().toString(36).substring(2, 16)}`;
      } else {
        try {
          const razorpay = getRazorpayClient();
          const rzpOrder = await razorpay.orders.create({
            amount: calculatedTotalPaise,
            currency: "INR",
            receipt: orderNumber,
            notes: {
              order_id: finalOrderId,
              customer_name: data.name,
              customer_email: data.email,
              site_order_number: orderNumber,
            },
          });

          razorpayOrderId = rzpOrder.id;

          // Save razorpay_order_id to the database order record
          if (!orderResult.isDemo) {
            const supabase = createAdminClient();
            await supabase
              .from("orders")
              .update({
                razorpay_order_id: razorpayOrderId,
                updated_at: new Date().toISOString(),
              } as any)
              .eq("id", finalOrderId);
          }
        } catch (rzpErr: any) {
          console.error("[Razorpay API Error create-order]:", rzpErr);

          if (isProductionPaymentEnv()) {
            await sendAdminPaymentAlertEmail({
              subject: "Razorpay Order Creation Failed in Production",
              message: `Failed to create order on Razorpay for order #${orderNumber}: ${
                rzpErr?.message || "Unknown error"
              }`,
            });
          }

          return NextResponse.json(
            {
              error:
                "Payments are temporarily unavailable. Please try again soon or message us on WhatsApp",
            },
            { status: 503 }
          );
        }
      }
    } else {
      // 13. Cash on Delivery Email Notifications
      Promise.allSettled([
        sendCustomerCodOrderEmail({
          order: createdOrder,
          items: (orderResult.items || orderItemsToInsert) as OrderItem[],
        }),
        sendAdminCodOrderAlertEmail({
          order: createdOrder,
          items: (orderResult.items || orderItemsToInsert) as OrderItem[],
        }),
      ]).catch((notifyErr) => {
        console.error("[COD notification error]:", notifyErr);
      });
    }

    // 14. Return only what the client needs
    return NextResponse.json({
      success: true,
      orderId: finalOrderId,
      orderNumber,
      publicToken,
      totalPaise: calculatedTotalPaise,
      subtotalPaise: calculatedSubtotalPaise,
      discountPaise: calculatedDiscountPaise,
      shippingFeePaise,
      codFeePaise,
      deliveryMode,
      razorpayOrderId,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || "",
      isCod,
      redirectUrl: isCod ? `/order/${finalOrderId}${publicToken ? `?token=${publicToken}` : ""}` : undefined,
      isSimulation: isDevSimulatedOrder,
      prefill: {
        name: data.name,
        email: data.email,
        contact: data.phone,
      },
    });
  } catch (error) {
    console.error("[Checkout Create Order Exception]:", error);
    return NextResponse.json(
      { error: "Server failed to initiate order. Please try again." },
      { status: 500 }
    );
  }
}
