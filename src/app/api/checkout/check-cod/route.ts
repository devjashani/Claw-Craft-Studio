import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAdminSettings } from "@/lib/admin/admin-data";
import { checkIsLocalDeliveryPincode, isFreeShippingPromoActive } from "@/lib/settings/shipping-promo";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/check-cod
 * Checks whether Pay on Delivery (COD) is available for a given 6-digit PIN code.
 * Strictly rate-limited per IP and returns only the boolean availability + limits.
 * Never returns the internal database list of PIN codes.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting (30 requests per minute per IP)
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anon-client";

    const rl = checkRateLimit(`check-cod-${clientIp}`, 30, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many checks. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawPin = String(body.pincode || "").trim();
    const isValidPin = /^[1-9][0-9]{5}$/.test(rawPin);

    // 2. Fetch Server Settings
    const settings = await getAdminSettings();
    const codMasterEnabled = Boolean(
      settings.cod_enabled ||
      settings.enable_cod ||
      process.env.NEXT_PUBLIC_ENABLE_COD === "true" ||
      process.env.ENABLE_COD === "true"
    );

    // 3. Check if PIN code is in active local delivery zone
    let isLocal = false;
    let areaName: string | undefined;

    if (isValidPin) {
      const localResult = await checkIsLocalDeliveryPincode(rawPin);
      isLocal = localResult.isLocal;
      areaName = localResult.areaName;
    }

    // 4. Check Free Shipping Promo status for this delivery mode
    const promo = isFreeShippingPromoActive(isLocal ? "local" : "courier", settings);

    const codFeeInr = typeof settings.cod_fee_inr === "number" ? settings.cod_fee_inr : 0;
    const maxOrderValueInr =
      typeof settings.cod_max_order_value_inr === "number" ? settings.cod_max_order_value_inr : 5000;

    return NextResponse.json({
      codAvailable: codMasterEnabled && isLocal,
      codEnabled: codMasterEnabled,
      isLocal,
      areaName: isLocal ? areaName : undefined,
      codFeeInr,
      codFeePaise: codFeeInr * 100,
      maxOrderValueInr,
      maxOrderValuePaise: maxOrderValueInr * 100,
      confirmationNote: settings.cod_confirmation_note || "Our studio artisan will call you to confirm your order details and delivery window before dispatch.",
      localDeliveryWindow: settings.local_delivery_window_text || "",
      freeShippingPromo: {
        active: promo.active,
        scope: promo.scope,
        endsAtFormatted: promo.endsAtFormatted,
      },
      flatShippingPaise: settings.flat_shipping_paise,
      freeShippingThresholdPaise: settings.free_shipping_threshold_paise,
    });
  } catch (err: any) {
    console.error("[Check COD Exception]", err);
    return NextResponse.json(
      { codAvailable: false, error: "Unable to verify delivery zone." },
      { status: 500 }
    );
  }
}
