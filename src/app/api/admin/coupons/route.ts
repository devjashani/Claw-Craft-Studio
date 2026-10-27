import { NextRequest, NextResponse } from "next/server";
import {
  getAdminCoupons,
  saveAdminCoupon,
  deleteAdminCoupon,
  toggleCouponActive,
} from "@/lib/admin/admin-data";
import { assertAdminApi, logAdminAudit } from "@/lib/auth/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { isAdmin, errorResponse } = await assertAdminApi(req);
    if (!isAdmin) return errorResponse;

    const coupons = await getAdminCoupons();
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("[Admin Coupons GET]", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isAdmin, session, errorResponse } = await assertAdminApi(req);
    if (!isAdmin) return errorResponse;

    const body = await req.json();
    if (!body.code || typeof body.discount_value !== "number") {
      return NextResponse.json(
        { error: "Coupon code and discount value are required." },
        { status: 400 }
      );
    }

    const saved = await saveAdminCoupon(body);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    await logAdminAudit({
      adminEmail: session?.email || "admin",
      action: "coupon_create",
      target: `code_${body.code.toUpperCase()}`,
      ip,
      success: true,
    });

    return NextResponse.json({ success: true, coupon: saved });
  } catch (error) {
    console.error("[Admin Coupons POST]", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { isAdmin, session, errorResponse } = await assertAdminApi(req);
    if (!isAdmin) return errorResponse;

    const body = await req.json();
    const { id, is_active } = body;
    if (!id || typeof is_active !== "boolean") {
      return NextResponse.json({ error: "ID and active state required." }, { status: 400 });
    }

    await toggleCouponActive(id, is_active);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    await logAdminAudit({
      adminEmail: session?.email || "admin",
      action: "coupon_update",
      target: `coupon_${id}_active_${is_active}`,
      ip,
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Coupons PATCH]", error);
    return NextResponse.json({ error: "Failed to toggle coupon" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { isAdmin, session, errorResponse } = await assertAdminApi(req);
    if (!isAdmin) return errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required." }, { status: 400 });
    }

    await deleteAdminCoupon(id);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    await logAdminAudit({
      adminEmail: session?.email || "admin",
      action: "coupon_delete",
      target: `coupon_${id}`,
      ip,
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Coupons DELETE]", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
