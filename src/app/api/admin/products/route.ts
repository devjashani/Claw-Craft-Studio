import { NextRequest, NextResponse } from "next/server";
import {
  getAdminProducts,
  saveAdminProduct,
  updateProductStock,
  toggleProductActive,
} from "@/lib/admin/admin-data";
import { assertAdminApi, logAdminAudit } from "@/lib/auth/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { isAdmin, errorResponse } = await assertAdminApi(req);
    if (!isAdmin) return errorResponse;

    const products = await getAdminProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[Admin Products API GET]", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isAdmin, session, errorResponse } = await assertAdminApi(req);
    if (!isAdmin) return errorResponse;

    const body = await req.json();

    if (!body.title || typeof body.price_paise !== "number") {
      return NextResponse.json(
        { error: "Product title and price in paise are required." },
        { status: 400 }
      );
    }

    const saved = await saveAdminProduct(body);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    await logAdminAudit({
      adminEmail: session?.email || "admin",
      action: "product_create",
      target: `product_${saved?.id || body.slug || "new"}`,
      ip,
      success: true,
    });

    return NextResponse.json({ success: true, product: saved });
  } catch (error) {
    console.error("[Admin Products API POST]", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { isAdmin, session, errorResponse } = await assertAdminApi(req);
    if (!isAdmin) return errorResponse;

    const body = await req.json();
    const { id, stock_count, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    if (typeof stock_count === "number") {
      await updateProductStock(id, stock_count);
      await logAdminAudit({
        adminEmail: session?.email || "admin",
        action: "stock_adjust",
        target: `product_${id}_qty_${stock_count}`,
        ip,
        success: true,
      });
    }

    if (typeof is_active === "boolean") {
      await toggleProductActive(id, is_active);
      await logAdminAudit({
        adminEmail: session?.email || "admin",
        action: "product_update",
        target: `product_${id}_active_${is_active}`,
        ip,
        success: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Products API PATCH]", error);
    return NextResponse.json({ error: "Failed to update product state" }, { status: 500 });
  }
}
