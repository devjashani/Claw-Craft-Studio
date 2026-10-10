import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminCustomRequests,
  updateAdminCustomRequestStatus,
} from "@/lib/admin/admin-data";
import { assertAdminApi } from "@/lib/auth/admin-auth";
import { addCustomRequestAdminEvent } from "@/lib/custom-requests/service";
import { CustomRequestStatus } from "@/types/database.types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { isAdmin, errorResponse } = await assertAdminApi();
    if (!isAdmin) return errorResponse;

    const requests = await getAdminCustomRequests();
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[Admin Custom Requests GET]", error);
    return NextResponse.json({ error: "Failed to fetch custom requests" }, { status: 500 });
  }
}

const addEventSchema = z.object({
  requestId: z.string().uuid("Valid custom request UUID required"),
  status: z.string().optional(),
  customerMessage: z.string().max(1000, "Customer message max 1000 characters").optional().nullable(),
  internalNote: z.string().max(2000, "Internal note max 2000 characters").optional().nullable(),
  sendEmail: z.boolean().default(true),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { isAdmin, session, errorResponse } = await assertAdminApi();
    if (!isAdmin) return errorResponse;

    const body = await req.json();
    const parsed = addEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid payload." },
        { status: 400 }
      );
    }

    const { requestId, status, customerMessage, internalNote, sendEmail } = parsed.data;

    const result = await addCustomRequestAdminEvent({
      requestId,
      status: status as CustomRequestStatus | undefined,
      customerMessage,
      internalNote,
      adminId: session?.email ? null : null,
      sendEmail,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update custom request." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, eventId: result.eventId });
  } catch (error) {
    console.error("[Admin Custom Requests POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { isAdmin, errorResponse } = await assertAdminApi();
    if (!isAdmin) return errorResponse;

    const body = await req.json();
    const { id, status, admin_notes } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required." }, { status: 400 });
    }

    await updateAdminCustomRequestStatus(id, status, admin_notes);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Custom Requests PATCH]", error);
    return NextResponse.json({ error: "Failed to update custom request" }, { status: 500 });
  }
}
