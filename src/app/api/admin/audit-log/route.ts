import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAudit, maskIp } from "@/lib/auth/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatIST } from "@/lib/custom-requests/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin({ isApi: true });
    const supabase = createAdminClient();

    // Fetch last 20 events from admin_audit_log
    const { data: events, error } = await (supabase as any)
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      // If table does not exist yet, return empty list gracefully
      return NextResponse.json({
        success: true,
        events: [],
        lastLogin: null,
        message: "Audit table not initialized yet.",
      });
    }

    // Find the last successful login event
    const { data: lastLoginRows } = await (supabase as any)
      .from("admin_audit_log")
      .select("*")
      .eq("action", "login_success")
      .eq("success", true)
      .order("created_at", { ascending: false })
      .limit(2);

    const latestLogin = lastLoginRows && lastLoginRows.length > 0 ? lastLoginRows[0] : null;

    const formattedEvents = (events || []).map((e: any) => ({
      id: e.id,
      adminEmail: e.admin_email,
      action: e.action,
      target: e.target,
      ipHash: e.ip_hash,
      userAgent: e.user_agent,
      success: e.success,
      createdAtIST: formatIST(e.created_at),
      createdAtRaw: e.created_at,
    }));

    return NextResponse.json({
      success: true,
      currentAdmin: admin.email,
      events: formattedEvents,
      lastLogin: latestLogin
        ? {
            email: latestLogin.admin_email,
            timeIST: formatIST(latestLogin.created_at),
            ipHash: latestLogin.ip_hash,
            userAgent: latestLogin.user_agent,
          }
        : null,
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED_ADMIN" ? 401 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch audit log" },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin({ isApi: true });
    const body = await req.json();
    const { action, target } = body;

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = req.headers.get("user-agent") || undefined;

    await logAdminAudit({
      adminEmail: admin.email,
      action: action || "admin_action",
      target: target || undefined,
      ip,
      userAgent,
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED_ADMIN" ? 401 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to log audit event" },
      { status }
    );
  }
}
