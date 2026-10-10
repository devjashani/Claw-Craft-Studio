import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUserCustomRequests } from "@/lib/custom-requests/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    // Rate limit per user
    const rl = checkRateLimit(`account_custom_requests_${user.id}`, 60, 60000);
    if (!rl.success) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    const isVerified = Boolean(user.email_confirmed_at);
    const result = await getUserCustomRequests(user.id, user.email || "", isVerified);

    if (!result.verified) {
      return NextResponse.json({
        verified: false,
        message: "Please verify your email address to view custom build requests linked to your account.",
        requests: [],
      });
    }

    return NextResponse.json({
      verified: true,
      requests: result.requests,
    });
  } catch (err) {
    console.error("[Account Custom Requests Exception]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
