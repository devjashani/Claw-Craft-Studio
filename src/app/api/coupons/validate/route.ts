import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Coupon } from "@/types/shop";

export const dynamic = "force-dynamic";

interface ValidateCouponBody {
  code: string;
  subtotalPaise: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: ValidateCouponBody = await req.json();
    const { code, subtotalPaise } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Invalid coupon code format." },
        { status: 400 }
      );
    }

    const sanitizedCode = code.trim().toUpperCase();

    // 1. Try querying Supabase
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", sanitizedCode)
        .eq("is_active", true)
        .single();

      const coupon = data as Coupon | null;

      if (!error && coupon) {
        // Check expiration
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          return NextResponse.json(
            { error: "This coupon code has expired." },
            { status: 400 }
          );
        }

        // Check usage limit
        if (
          coupon.usage_limit &&
          coupon.times_used >= coupon.usage_limit
        ) {
          return NextResponse.json(
            { error: "This coupon has reached its maximum usage limit." },
            { status: 400 }
          );
        }

        // Check minimum order amount
        if (subtotalPaise < coupon.min_order_paise) {
          const minRupees = coupon.min_order_paise / 100;
          return NextResponse.json(
            {
              error: `Minimum order value for ${sanitizedCode} is Rs ${minRupees.toLocaleString(
                "en-IN"
              )}.`,
            },
            { status: 400 }
          );
        }

        // Calculate discount
        let discountPaise = 0;
        if (coupon.discount_type === "percentage") {
          discountPaise = Math.round(
            (subtotalPaise * coupon.discount_value) / 100
          );
          if (coupon.max_discount_paise) {
            discountPaise = Math.min(discountPaise, coupon.max_discount_paise);
          }
        } else {
          // Flat discount
          discountPaise = coupon.discount_value;
        }

        return NextResponse.json({
          valid: true,
          code: coupon.code,
          discountType: coupon.discount_type,
          discountValue: coupon.discount_value,
          discountPaise: Math.min(discountPaise, subtotalPaise),
        });
      }
    } catch {
      // Fallback below
    }

    // 2. Built-in Fallback for CLAW10
    if (sanitizedCode === "CLAW10") {
      if (subtotalPaise < 100000) {
        return NextResponse.json(
          { error: "Minimum order value for CLAW10 is Rs 1,000." },
          { status: 400 }
        );
      }

      const discountPaise = Math.round(subtotalPaise * 0.1);
      return NextResponse.json({
        valid: true,
        code: "CLAW10",
        discountType: "percentage",
        discountValue: 10,
        discountPaise,
      });
    }

    return NextResponse.json(
      { error: "Invalid or expired coupon code." },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred while validating coupon." },
      { status: 500 }
    );
  }
}
