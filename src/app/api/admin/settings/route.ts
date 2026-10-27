import { NextRequest, NextResponse } from "next/server";
import { getAdminSettings, saveAdminSettings } from "@/lib/admin/admin-data";
import { assertAdminApi } from "@/lib/auth/admin-auth";
import { getRazorpayGatewayStatus } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { isAdmin, errorResponse } = await assertAdminApi();
    if (!isAdmin) return errorResponse;

    const settings = await getAdminSettings();
    const paymentGateway = await getRazorpayGatewayStatus();

    return NextResponse.json({ settings, paymentGateway });
  } catch (error) {
    console.error("[Admin Settings GET]", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { isAdmin, errorResponse } = await assertAdminApi();
    if (!isAdmin) return errorResponse;

    const body = await req.json();
    const updated = await saveAdminSettings(body);
    const paymentGateway = await getRazorpayGatewayStatus();

    return NextResponse.json({ success: true, settings: updated, paymentGateway });
  } catch (error) {
    console.error("[Admin Settings PUT]", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
