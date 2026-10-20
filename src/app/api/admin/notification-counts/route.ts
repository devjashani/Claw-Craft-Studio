import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  ATTENTION_ORDER_STATUSES,
  ATTENTION_INQUIRY_STATUSES,
} from "@/lib/admin/attention";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Strict Server-Side Admin Authentication Check
    const { isAdmin, session, errorResponse } = await assertAdminApi();
    if (!isAdmin || !session) {
      return errorResponse || NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Light Per-Admin Rate Limiting (60 requests per 60s per admin account)
    const rateLimitKey = `admin_counts_${session.email.toLowerCase()}`;
    const rl = checkRateLimit(rateLimitKey, 60, 60000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "30" } }
      );
    }

    let ordersCount = 0;
    let inquiriesCount = 0;
    let latestOrder: string | null = null;
    let latestInquiry: string | null = null;

    // 3. Supabase Service-Role Queries
    try {
      const supabase = createAdminClient();

      // Query 1: Exact count of orders awaiting fulfillment + latest order number only
      const { count: oCount, data: oData, error: oError } = await supabase
        .from("orders")
        .select("order_number, created_at", { count: "exact" })
        .in("status", ATTENTION_ORDER_STATUSES)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!oError && typeof oCount === "number") {
        ordersCount = oCount;
        latestOrder = oData?.[0]?.order_number || null;
      }

      // Query 2: Exact count of custom requests needing artisan review + latest ref code only
      const { count: iCount, data: iData, error: iError } = await supabase
        .from("custom_requests")
        .select("ref_code, created_at", { count: "exact" })
        .in("status", ATTENTION_INQUIRY_STATUSES)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!iError && typeof iCount === "number") {
        inquiriesCount = iCount;
        latestInquiry = iData?.[0]?.ref_code || null;
      }
    } catch {
      // In offline / mock fallback mode, compute from mock store
      try {
        const { getAdminOrders, getAdminCustomRequests } = await import("@/lib/admin/admin-data");
        const mockOrders = await getAdminOrders();
        const attentionOrders = mockOrders.filter((o) =>
          ATTENTION_ORDER_STATUSES.includes(o.status)
        );
        ordersCount = attentionOrders.length;
        latestOrder = attentionOrders[0]?.order_number || null;

        const mockInquiries = await getAdminCustomRequests();
        const attentionInquiries = mockInquiries.filter((r) =>
          ATTENTION_INQUIRY_STATUSES.includes(r.status as any)
        );
        inquiriesCount = attentionInquiries.length;
        latestInquiry = attentionInquiries[0]?.ref_code || null;
      } catch {
        // Fallback default zeros
      }
    }

    // 4. Return clean, zero-PII payload
    return NextResponse.json(
      {
        orders: ordersCount,
        inquiries: inquiriesCount,
        latestOrder,
        latestInquiry,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("[Admin Notification Counts API Exception]", error);
    return NextResponse.json(
      { error: "Internal server error fetching admin counts" },
      { status: 500 }
    );
  }
}
