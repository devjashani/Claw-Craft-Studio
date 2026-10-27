import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron Job: Cancels stale 'pending_payment' orders older than 24 hours.
 * Stock was never deducted for unpaid orders, so nothing to restore.
 * Never alerts the owner.
 * Protected by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    const headerSecret = req.headers.get("x-cron-secret");

    // Enforce authorization if CRON_SECRET is configured
    if (cronSecret) {
      const isBearerMatch = authHeader === `Bearer ${cronSecret}`;
      const isHeaderMatch = headerSecret === cronSecret;
      if (!isBearerMatch && !isHeaderMatch) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      console.warn("[Cron Warning] CRON_SECRET is not configured in production environment variables.");
    }

    const supabase = createAdminClient();
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Query pending_payment orders older than 24 hours
    const { data: staleOrders, error: fetchErr } = await supabase
      .from("orders")
      .select("id, order_number, created_at, status")
      .eq("status", "pending_payment")
      .eq("payment_status", "pending_payment")
      .lt("created_at", cutoffDate);

    if (fetchErr) {
      console.error("[Cron Cleanup Error] Failed to fetch stale orders:", fetchErr.message);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!staleOrders || staleOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No stale pending orders to cleanup.",
        cancelledCount: 0,
      });
    }

    const orderIds = staleOrders.map((o) => o.id);
    const nowIso = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        payment_status: "cancelled",
        admin_notes: "Auto-cancelled: Unpaid reservation older than 24 hours.",
        updated_at: nowIso,
      } as any)
      .in("id", orderIds);

    if (updateErr) {
      console.error("[Cron Cleanup Error] Failed to cancel stale orders:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    console.log(
      `[Cron Cleanup] Successfully cancelled ${orderIds.length} stale pending orders older than 24 hours.`
    );

    return NextResponse.json({
      success: true,
      cancelledCount: orderIds.length,
      orders: staleOrders.map((o) => o.order_number),
    });
  } catch (error: any) {
    console.error("[Cron Cleanup Exception]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal cron error" },
      { status: 500 }
    );
  }
}
