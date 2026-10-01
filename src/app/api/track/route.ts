import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Order, OrderItem } from "@/types/shop";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderIdentifier, phone } = await req.json();

    if (!orderIdentifier || !phone) {
      return NextResponse.json(
        { error: "Order ID/Number and Phone number are required." },
        { status: 400 }
      );
    }

    const cleanIdentifier = orderIdentifier.trim().toUpperCase();
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    const supabase = createAdminClient();

    // Search by order_number or id
    const { data: dbOrders, error } = await supabase
      .from("orders")
      .select("*")
      .or(`order_number.eq.${cleanIdentifier},id.eq.${cleanIdentifier}`);

    if (error || !dbOrders || dbOrders.length === 0) {
      return NextResponse.json(
        { error: "No matching order found. Please check your order reference." },
        { status: 404 }
      );
    }

    // Verify phone number matches last 4 or full digits
    const matchingOrder = dbOrders.find((o) => {
      const orderPhone = o.customer_phone.replace(/[^0-9]/g, "");
      return orderPhone.endsWith(cleanPhone) || cleanPhone.endsWith(orderPhone);
    }) as unknown as Order | undefined;

    if (!matchingOrder) {
      return NextResponse.json(
        {
          error:
            "Phone number does not match the record for this order. Please verify.",
        },
        { status: 403 }
      );
    }

    // Fetch items
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", matchingOrder.id);

    return NextResponse.json({
      order: matchingOrder,
      items: (items as unknown as OrderItem[]) || [],
    });
  } catch (err) {
    console.error("[Track API Error]:", err);
    return NextResponse.json(
      { error: "Internal error processing tracking request." },
      { status: 500 }
    );
  }
}
