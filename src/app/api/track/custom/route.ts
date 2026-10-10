import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getCustomRequestByToken,
  getCustomRequestByEmail,
} from "@/lib/custom-requests/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const rl = checkRateLimit(`track_custom_${ip}`, 20, 60000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many tracking lookups. Please wait a minute and retry." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { ref, token, email } = body;

    const cleanRef = typeof ref === "string" ? ref.trim() : "";
    if (!cleanRef) {
      return NextResponse.json(
        { error: "Reference code is required." },
        { status: 400 }
      );
    }

    // 1. Direct Token Verification (Preferred)
    if (token && typeof token === "string") {
      const result = await getCustomRequestByToken(cleanRef, token);
      if (!result.success || !result.data) {
        return NextResponse.json(
          { error: "Invalid reference code or security token." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        request: result.data,
      });
    }

    // 2. Email + Reference Code Verification
    if (email && typeof email === "string") {
      const result = await getCustomRequestByEmail(cleanRef, email);
      if (!result.success || !result.data) {
        return NextResponse.json(
          { error: "No custom request found matching provided reference and email." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        request: result.data,
        publicToken: result.publicToken,
      });
    }

    return NextResponse.json(
      { error: "Please provide either a security token or your registered email address." },
      { status: 400 }
    );
  } catch (err) {
    console.error("[Track Custom API Exception]", err);
    return NextResponse.json(
      { error: "Internal tracking server error." },
      { status: 500 }
    );
  }
}
