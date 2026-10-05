import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient } from "@/lib/razorpay";
import { getProducts, getProductImageUrl } from "@/lib/products";
import { checkoutFormSchema } from "@/lib/validation/checkout";
import { Coupon } from "@/types/shop";
import { createOrder, CreateOrderInputItem } from "@/lib/orders/order-service";

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

    // 1. Validate Form Values with Zod
    const validationResult = checkoutFormSchema.safeParse(formValues);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || "Invalid checkout details.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = validationResult.data;

    // 2. SERVER-SIDE PRICE RECALCULATION (NEVER trust client prices, recompute strictly per variant from DB)
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

      // Recompute price strictly from database variant if variant specified
      let unitPricePaise = dbProduct.price_paise;
      let variantLabel = item.variantLabel || null;
      let variantId = item.variantId || null;

      if (variantId && dbProduct.variants && dbProduct.variants.length > 0) {
        const foundVariant = dbProduct.variants.find((v) => v.id === variantId);
        if (foundVariant) {
          unitPricePaise = foundVariant.price_paise;
          variantLabel = foundVariant.label;
        }
      }

      const qty = Math.max(1, Math.floor(item.quantity));
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

    // 3. Coupon Validation & Discount
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
        // Fallback for CLAW10
        if (cleanCode === "CLAW10" && calculatedSubtotalPaise >= 100000) {
          calculatedDiscountPaise = Math.round(calculatedSubtotalPaise * 0.1);
        }
      }
    }

    // 4. Shipping Calculation
    const FREE_SHIPPING_THRESHOLD_PAISE = 299900; // Rs 2,999
    const FLAT_SHIPPING_PAISE = 14900; // Rs 149
    const shippingFeePaise =
      calculatedSubtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE
        ? 0
        : FLAT_SHIPPING_PAISE;

    // 5. Final Recomputed Total
    const calculatedTotalPaise = Math.max(
      0,
      calculatedSubtotalPaise - calculatedDiscountPaise + shippingFeePaise
    );

    // 6. Check if COD is requested
    const isCod = data.paymentMethod === "cod";

    // 7. Create Order via unified data layer
    const orderItemsForCreate: CreateOrderInputItem[] = orderItemsToInsert.map((item, idx) => ({
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
    }));

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

    // 8. If Razorpay, generate Razorpay Order
    let razorpayOrderId: string | null = null;

    if (!isCod) {
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
          },
        });

        razorpayOrderId = rzpOrder.id;

        if (!orderResult.isDemo) {
          const supabase = createAdminClient();
          await supabase
            .from("orders")
            .update({ razorpay_order_id: razorpayOrderId } as any)
            .eq("id", createdOrder.id);
        }
      } catch (err) {
        console.warn("[Razorpay Test Mode Notice] Live credentials pending or test order:", err);
        razorpayOrderId = `order_${Math.random().toString(36).substring(2, 16)}`;
      }
    }

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
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
      isCod,
      isDemo: orderResult.isDemo,
    });
  } catch (error) {
    console.error("[Checkout Create Order Error]:", error);
    return NextResponse.json(
      { error: "Server failed to initiate order. Please try again." },
      { status: 500 }
    );
  }
}
