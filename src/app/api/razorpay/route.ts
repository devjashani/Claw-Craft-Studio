import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Direct client-initiated order creation is disabled for security.
 * Amounts must always be recomputed server-side from database records via /api/checkout/create-order.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct payment initiation is disabled for security. All orders must be initiated through /api/checkout/create-order.",
    },
    { status: 405 }
  );
}
