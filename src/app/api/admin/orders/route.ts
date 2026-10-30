import { NextRequest, NextResponse } from "next/server";
import { getAdminOrders } from "@/lib/admin/admin-data";
import { assertAdminApi } from "@/lib/auth/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { isAdmin, errorResponse } = await assertAdminApi(req);
    if (!isAdmin) return errorResponse;

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("include_archived") === "true";
    const rawStatus = searchParams.get("status") || "all";
    const status = includeArchived && rawStatus === "all" ? "all_with_archived" : rawStatus;
    const orders = await getAdminOrders(status);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[Admin Orders API GET]", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
