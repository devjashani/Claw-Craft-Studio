import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUserCustomRequestDetail } from "@/lib/custom-requests/service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { ref: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const cleanRef = decodeURIComponent(params.ref || "");
    if (!cleanRef) {
      return NextResponse.json({ error: "Reference code required." }, { status: 400 });
    }

    // Rate limit per user
    const rl = checkRateLimit(`account_custom_detail_${user.id}`, 60, 60000);
    if (!rl.success) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    const isVerified = Boolean(user.email_confirmed_at);
    if (!isVerified) {
      return NextResponse.json(
        { error: "Please verify your email address to access this request." },
        { status: 403 }
      );
    }

    const result = await getUserCustomRequestDetail(
      cleanRef,
      user.id,
      user.email || "",
      isVerified
    );

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Custom request not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      request: result.data,
    });
  } catch (err) {
    console.error("[Account Custom Request Detail Exception]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
