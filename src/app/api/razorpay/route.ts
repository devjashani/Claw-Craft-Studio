import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured in environment variables." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { amount, currency = "INR", receipt } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Amount must be a positive number." },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Convert to paise (smallest currency unit for INR)
    const amountInPaise = Math.round(amount * 100);

    const orderOptions: {
      amount: number;
      currency: string;
      receipt?: string;
    } = {
      amount: amountInPaise,
      currency: currency || "INR",
    };

    if (receipt) {
      orderOptions.receipt = String(receipt);
    }

    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    console.error("[Razorpay API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create Razorpay order." },
      { status: 500 }
    );
  }
}
