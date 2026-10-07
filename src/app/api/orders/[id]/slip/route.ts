import { NextRequest, NextResponse } from "next/server";
import { getOrder, verifyOrderAccess } from "@/lib/orders/order-service";
import { getAdminSession } from "@/lib/auth/admin-auth";
import { buildSlipPdf } from "@/lib/pdf/order-slip";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const rl = checkRateLimit(`slip_${ip}`, 30, 60000);
    if (!rl.success) {
      return new NextResponse("Rate limit exceeded. Please wait a moment.", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }

    const { id } = params;
    const url = new URL(req.url);
    const token = url.searchParams.get("t");
    const phone = url.searchParams.get("phone");

    const adminSession = await getAdminSession();
    const isAdmin = Boolean(adminSession);

    // Check user session
    let userId: string | null = null;
    try {
      const userSupabase = createClient();
      const { data: authData } = await userSupabase.auth.getUser();
      userId = authData?.user?.id || null;
    } catch {
      // Unauthenticated visitor
    }

    // Fetch order from data layer
    const { order, items, isDemo } = await getOrder(id);

    if (!order) {
      return new NextResponse("Order not found.", { status: 404 });
    }

    order.items = items;
    order.isDemo = isDemo;

    // Verify access control (admin, token, phone, or owner user_id)
    const access = verifyOrderAccess(order, token, phone, isAdmin, userId);
    if (!access.allowed) {
      return new NextResponse("Access forbidden. Valid token, phone, or account required.", {
        status: 403,
      });
    }

    // Optional site settings (watermark, GSTIN, business address)
    let watermarkText = "CLAWCRAFT STUDIO";
    let gstin = "";
    let businessAddress = "";

    try {
      const supabase = createAdminClient();
      const { data: settings } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["watermark_text", "gstin", "business_address"]);

      if (settings) {
        for (const s of settings) {
          if (s.key === "watermark_text" && typeof s.value === "string") watermarkText = s.value;
          if (s.key === "gstin" && typeof s.value === "string") gstin = s.value;
          if (s.key === "business_address" && typeof s.value === "string") businessAddress = s.value;
        }
      }
    } catch {
      // ignore
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://clawcraft.in";
    const pdfBytes = await buildSlipPdf(order, {
      watermarkText,
      gstin,
      businessAddress,
      siteUrl,
      isDemo,
    });

    const filename = `CLAWCRAFT-Receipt-${order.order_number}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Order Slip API Error]:", error);
    return new NextResponse("Failed to generate order slip PDF.", { status: 500 });
  }
}
