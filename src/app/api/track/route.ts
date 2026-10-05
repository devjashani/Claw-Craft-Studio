import { NextRequest, NextResponse } from "next/server";
import { getOrder, verifyOrderAccess } from "@/lib/orders/order-service";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const rl = checkRateLimit(`track_${ip}`, 15, 60000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many tracking lookups. Please wait a minute and retry." },
        { status: 429 }
      );
    }

    const { orderIdentifier, phone, token } = await req.json();

    if (!orderIdentifier || (!phone && !token)) {
      return NextResponse.json(
        { error: "Order reference and registered phone number or security token are required." },
        { status: 400 }
      );
    }

    const cleanIdentifier = orderIdentifier.trim().toUpperCase();
    const { order, items } = await getOrder(cleanIdentifier);

    if (!order) {
      return NextResponse.json(
        { error: "No matching order found. Please check your order reference." },
        { status: 404 }
      );
    }

    // Security check: token comparison or phone verification
    const access = verifyOrderAccess(order, token, phone);
    if (!access.allowed) {
      return NextResponse.json(
        {
          error:
            "Verification failed. The phone number does not match studio records for this order.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      order,
      items,
    });
  } catch (err) {
    console.error("[Track API Error]:", err);
    return NextResponse.json(
      { error: "Internal error processing tracking request." },
      { status: 500 }
    );
  }
}
