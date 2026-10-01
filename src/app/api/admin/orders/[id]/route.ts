import { NextRequest, NextResponse } from "next/server";
import { getAdminOrderById, updateAdminOrder } from "@/lib/admin/admin-data";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const data = await getAdminOrderById(params.id);
    if (!data.order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Admin Order GET by ID]", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const body = await req.json();
    const updated = await updateAdminOrder({
      id: params.id,
      status: body.status,
      courier_name: body.courier_name,
      tracking_number: body.tracking_number,
      tracking_url: body.tracking_url,
      estimated_delivery_date: body.estimated_delivery_date,
      admin_notes: body.admin_notes,
      notify_customer: Boolean(body.notify_customer),
    });

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("[Admin Order PATCH]", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
