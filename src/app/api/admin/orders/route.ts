import { NextRequest, NextResponse } from "next/server";
import { getAdminOrders } from "@/lib/admin/admin-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const orders = await getAdminOrders(status);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[Admin Orders API GET]", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
