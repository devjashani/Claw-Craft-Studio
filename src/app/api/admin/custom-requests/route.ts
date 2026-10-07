import { NextRequest, NextResponse } from "next/server";
import {
  getAdminCustomRequests,
  updateAdminCustomRequestStatus,
} from "@/lib/admin/admin-data";
import { assertAdminApi } from "@/lib/auth/admin-auth";

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
