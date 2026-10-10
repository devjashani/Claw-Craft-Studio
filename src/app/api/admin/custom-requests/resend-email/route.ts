import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-auth";
import { resendCustomRequestEventEmail } from "@/lib/custom-requests/service";

export const dynamic = "force-dynamic";

const resendSchema = z.object({
  eventId: z.string().uuid("Valid event UUID required"),
});

export async function POST(req: NextRequest) {
  try {
    const { isAdmin, errorResponse } = await assertAdminApi();
    if (!isAdmin) return errorResponse;

    const body = await req.json();
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Event ID required." },
        { status: 400 }
      );
    }

    const result = await resendCustomRequestEventEmail(parsed.data.eventId);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to resend email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Resend Event Email Exception]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
