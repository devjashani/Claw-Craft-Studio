import { NextRequest, NextResponse } from "next/server";
import {
  getAdminProductById,
  saveAdminProduct,
  deleteAdminProduct,
} from "@/lib/admin/admin-data";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const product = await getAdminProductById(params.id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[Admin Product GET by ID]", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const body = await req.json();
    body.id = params.id;
    const updated = await saveAdminProduct(body);
    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("[Admin Product PUT]", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    await deleteAdminProduct(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Product DELETE]", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
