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
import { Coupon } from "@/types/shop";
import { createOrder, CreateOrderInputItem } from "@/lib/orders/order-service";
import { sendAdminPaymentAlertEmail } from "@/lib/resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSiteHost } from "@/lib/site";

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

    // 6. Shipping Calculation
    const FREE_SHIPPING_THRESHOLD_PAISE = 299900; // Rs 2,999
    const FLAT_SHIPPING_PAISE = 14900; // Rs 149
    const shippingFeePaise =
      calculatedSubtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE
        ? 0
        : FLAT_SHIPPING_PAISE;

    // 7. Final Recomputed Total (Paise)
    const calculatedTotalPaise = Math.max(
      0,
      calculatedSubtotalPaise - calculatedDiscountPaise + shippingFeePaise
    );

    // 8. KEY MODE GUARD & ENVIRONMENT VALIDATION (for Online Razorpay Orders)
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

    // 9. Extract authenticated user session server-side (NEVER from client body)
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

    // 10. Create Order with status 'pending_payment'
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
      totalPaise: calculatedTotalPaise,
      couponId: validCouponId,
      couponCode: data.couponCode,
      userId: authenticatedUserId,
      isPaid: false, // NEVER mark paid at creation
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

    // 11. Create Real Razorpay Order via SDK
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
    }

    // 12. Return only what the client needs (Never expose key secret or full payment objects)
    return NextResponse.json({
      success: true,
      orderId: finalOrderId,
      orderNumber,
      publicToken,
      totalPaise: calculatedTotalPaise,
      subtotalPaise: calculatedSubtotalPaise,
      discountPaise: calculatedDiscountPaise,
      shippingFeePaise,
      razorpayOrderId,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || "",
      isCod,
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
