import { NextRequest, NextResponse } from "next/server";
import { getOrder, verifyOrderAccess } from "@/lib/orders/order-service";
import { getAdminSession } from "@/lib/auth/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const token = req.nextUrl.searchParams.get("t");
    const { order, isDemo } = await getOrder(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const adminSession = await getAdminSession();
    const isAdmin = Boolean(adminSession);

    const access = verifyOrderAccess(order, token, null, isAdmin);
    if (!access.allowed) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const isPaid = order.status === "paid" || order.payment_status === "paid";
    const isPending =
      order.status === "pending_payment" ||
      order.payment_status === "pending_payment" ||
      order.payment_status === "pending";
    const isCancelled = order.status === "cancelled" || order.status === "refunded";

    return NextResponse.json({
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        total_paise: order.total_paise,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        paid_at: order.paid_at,
        public_token: order.public_token,
        isPaid,
        isPending,
        isCancelled,
        isDemo,
      },
    });
  } catch (err) {
    console.error("[GET /api/orders/[id] Error]:", err);
    return NextResponse.json({ error: "Failed to fetch order status" }, { status: 500 });
  }
}
