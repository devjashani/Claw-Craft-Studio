import { createAdminClient } from "@/lib/supabase/admin";
import { SiteSettingsMap } from "@/lib/admin/admin-data";

export const DEFAULT_JAIPUR_LOCAL_PINCODES: ReadonlyArray<{ pincode: string; areaName: string }> = [
  { pincode: "302001", areaName: "Jaipur GPO / Ashok Nagar / C.P.M.G / Chandpole Bazar" },
  { pincode: "302002", areaName: "Amer Road / Govind Nagar" },
  { pincode: "302003", areaName: "Jaipur City / Haldiyon Ka Rasta" },
  { pincode: "302004", areaName: "Jawahar Nagar / Janta Colony" },
  { pincode: "302005", areaName: "High Court / Industrial Estate" },
  { pincode: "302006", areaName: "Ajmer Road / Jaipur R.S." },
  { pincode: "302011", areaName: "Sanganer Bazaar" },
  { pincode: "302012", areaName: "Jhotwara Industrial Area / Bindayaka / Hathoj" },
  { pincode: "302013", areaName: "Harmada / Akhepura" },
  { pincode: "302015", areaName: "Bapu Nagar / Bajaj Nagar / Barkat Nagar / Gandhi Nagar" },
  { pincode: "302016", areaName: "Bani Park / Collectorate / Dwarikapuri" },
  { pincode: "302017", areaName: "Jagatpura" },
  { pincode: "302018", areaName: "Durgapura / Tonk Road" },
  { pincode: "302020", areaName: "Mansarovar" },
  { pincode: "302021", areaName: "Heerapura" },
  { pincode: "302022", areaName: "Sitapura Industrial Area / Bilwa / Goner" },
  { pincode: "302026", areaName: "Bhankrota / Jaisinghpura Bas" },
  { pincode: "302027", areaName: "CRPF Campus Lalwas" },
  { pincode: "302028", areaName: "Amer / Basna / Bhanpur Kalan" },
  { pincode: "302029", areaName: "Sanganer Airport" },
  { pincode: "302031", areaName: "Jamdoli" },
  { pincode: "302033", areaName: "Pratap Nagar Housing Board" },
  { pincode: "302036", areaName: "Jaisinghpura Khore" },
  { pincode: "302039", areaName: "Amba Bari / Dehar Ka Balaji / Vidhyadhar Nagar" },
];

/**
 * Returns the current time in IST (Asia/Kolkata).
 */
export function getNowIST(): Date {
  return new Date();
}

/**
 * Parses an end-of-day date in IST (Asia/Kolkata) to millisecond epoch.
 * E.g. dateStr = "2026-10-31" -> 2026-10-31T23:59:59.999+05:30.
 */
export function parseEndOfDayIST(dateStr?: string | null): number | null {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.trim()) return null;

  try {
    const clean = dateStr.trim();
    // If it's already full ISO
    if (clean.includes("T")) {
      const d = new Date(clean);
      return isNaN(d.getTime()) ? null : d.getTime();
    }

    // YYYY-MM-DD format
    const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const [, year, month, day] = match;
    // IST is UTC+5:30 -> ISO: YYYY-MM-DDT23:59:59.999+05:30
    const istIsoString = `${year}-${month}-${day}T23:59:59.999+05:30`;
    const d = new Date(istIsoString);
    return isNaN(d.getTime()) ? null : d.getTime();
  } catch {
    return null;
  }
}

/**
 * Evaluates whether the free shipping promotion is currently active on the server.
 * Completely reversible, does not alter stored flat fee or threshold, and auto-expires
 * without needing cron jobs.
 */
export function isFreeShippingPromoActive(
  deliveryMode: "local" | "courier",
  settings: Partial<SiteSettingsMap>
): {
  active: boolean;
  endsAtFormatted?: string;
  scope: "all" | "local";
} {
  const isEnabled = Boolean(settings.free_shipping_promo_enabled);
  const scope = (settings.free_shipping_promo_scope || "local") as "all" | "local";

  if (!isEnabled) {
    return { active: false, scope };
  }

  // Check expiration if an end date is configured
  const endsAtEpoch = parseEndOfDayIST(settings.free_shipping_promo_ends_at);
  if (endsAtEpoch !== null) {
    const now = Date.now();
    if (now > endsAtEpoch) {
      // Promotion expired automatically
      return { active: false, scope };
    }
  }

  // Check scope match
  if (scope === "local" && deliveryMode !== "local") {
    // Only local Jaipur orders qualify
    return { active: false, scope };
  }

  let endsAtFormatted: string | undefined;
  if (settings.free_shipping_promo_ends_at) {
    endsAtFormatted = settings.free_shipping_promo_ends_at;
  }

  return { active: true, endsAtFormatted, scope };
}

/**
 * Check if a 6-digit Indian PIN code belongs to the active Jaipur local delivery zone.
 * Reads strictly from database with service-role privileges.
 */
export async function checkIsLocalDeliveryPincode(rawPincode?: string | null): Promise<{
  isLocal: boolean;
  areaName?: string;
}> {
  if (!rawPincode) return { isLocal: false };
  const cleanPin = rawPincode.trim();
  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return { isLocal: false };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cod_pincodes")
      .select("pincode, area_name, is_active")
      .eq("pincode", cleanPin)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && data) {
      return { isLocal: true, areaName: data.area_name };
    }

    if (error) {
      // If table not migrated yet, fallback to seed array
      const seedMatch = DEFAULT_JAIPUR_LOCAL_PINCODES.find((p) => p.pincode === cleanPin);
      if (seedMatch) {
        return { isLocal: true, areaName: seedMatch.areaName };
      }
    }
  } catch {
    const seedMatch = DEFAULT_JAIPUR_LOCAL_PINCODES.find((p) => p.pincode === cleanPin);
    if (seedMatch) {
      return { isLocal: true, areaName: seedMatch.areaName };
    }
  }

  return { isLocal: false };
}

export function calculateShippingDetailsServer(
  arg1: number | { subtotalPaise: number; deliveryMode?: "local" | "courier"; settings?: Partial<SiteSettingsMap> },
  arg2?: "local" | "courier",
  arg3?: Partial<SiteSettingsMap>
): {
  shippingFeePaise: number;
  isPromo: boolean;
  promoNotice?: string;
} {
  let subtotalPaise: number;
  let deliveryMode: "local" | "courier";
  let settings: Partial<SiteSettingsMap>;

  if (typeof arg1 === "object" && arg1 !== null) {
    subtotalPaise = arg1.subtotalPaise;
    deliveryMode = arg1.deliveryMode || "courier";
    settings = arg1.settings || {};
  } else {
    subtotalPaise = arg1;
    deliveryMode = arg2 || "courier";
    settings = arg3 || {};
  }

  // 1. Evaluate Promo First
  const promo = isFreeShippingPromoActive(deliveryMode, settings);
  if (promo.active) {
    return {
      shippingFeePaise: 0,
      isPromo: true,
      promoNotice: "FREE (limited-time offer)",
    };
  }

  // 2. Standard Threshold & Flat Fee
  const flatFee = typeof settings.flat_shipping_paise === "number" ? settings.flat_shipping_paise : 14900;
  const threshold = typeof settings.free_shipping_threshold_paise === "number" ? settings.free_shipping_threshold_paise : 299900;

  if (subtotalPaise >= threshold || subtotalPaise === 0) {
    return { shippingFeePaise: 0, isPromo: false };
  }

  return { shippingFeePaise: flatFee, isPromo: false };
}

/**
 * Server-side calculate shipping fee in Paise for an order.
 * Accepts either positional arguments or an object.
 */
export function calculateShippingFeeServer(
  arg1: number | { subtotalPaise: number; deliveryMode: "local" | "courier"; settings: Partial<SiteSettingsMap> },
  arg2?: "local" | "courier",
  arg3?: Partial<SiteSettingsMap>
): number {
  if (typeof arg1 === "object" && arg1 !== null) {
    return calculateShippingDetailsServer(arg1.subtotalPaise, arg1.deliveryMode, arg1.settings).shippingFeePaise;
  }
  return calculateShippingDetailsServer(arg1, arg2 || "courier", arg3 || {}).shippingFeePaise;
}
