import { NextRequest, NextResponse } from "next/server";
import {
  getAdminProducts,
  saveAdminProduct,
  updateProductStock,
  toggleProductActive,
} from "@/lib/admin/admin-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getAdminProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[Admin Products API GET]", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || typeof body.price_paise !== "number") {
      return NextResponse.json(
        { error: "Product title and price in paise are required." },
        { status: 400 }
      );
    }

    const saved = await saveAdminProduct(body);
    return NextResponse.json({ success: true, product: saved });
  } catch (error) {
    console.error("[Admin Products API POST]", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, stock_count, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    if (typeof stock_count === "number") {
      await updateProductStock(id, stock_count);
    }

    if (typeof is_active === "boolean") {
      await toggleProductActive(id, is_active);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Products API PATCH]", error);
    return NextResponse.json({ error: "Failed to update product state" }, { status: 500 });
  }
}
