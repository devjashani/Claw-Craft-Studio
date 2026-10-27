import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi, logAdminAudit } from "@/lib/auth/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_JAIPUR_LOCAL_PINCODES } from "@/lib/settings/shipping-promo";
import { CodPincode } from "@/types/shop";

export const dynamic = "force-dynamic";

/**
 * Validates an Indian PIN code: 6 digits, non-zero first digit.
 */
function isValidIndianPincode(pin: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pin.trim());
}

/**
 * GET /api/admin/cod-pincodes
 * List all configured Jaipur delivery zone PIN codes, with active and total counts.
 */
export async function GET(req: NextRequest) {
  try {
    const { isAdmin, errorResponse } = await assertAdminApi(req);
    if (!isAdmin) return errorResponse;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cod_pincodes")
      .select("*")
      .order("pincode", { ascending: true });

    let pincodes: CodPincode[] = [];

    if (error || !data || data.length === 0) {
      // If table empty or migration not applied yet, present the default 23 seed codes
      pincodes = DEFAULT_JAIPUR_LOCAL_PINCODES.map((p) => ({
        pincode: p.pincode,
        area_name: p.areaName,
        is_active: true,
        created_at: new Date().toISOString(),
      }));
    } else {
      pincodes = data as CodPincode[];
    }

    const activeCount = pincodes.filter((p) => p.is_active).length;

    return NextResponse.json({
      success: true,
      pincodes,
      activeCount,
      totalCount: pincodes.length,
    });
  } catch (err: any) {
    console.error("[Admin COD Pincodes GET Error]", err);
    return NextResponse.json({ error: "Failed to fetch COD PIN codes." }, { status: 500 });
  }
}

/**
 * POST /api/admin/cod-pincodes
 * Add a single PIN code or bulk import/paste comma/newline separated PIN codes.
 */
export async function POST(req: NextRequest) {
  try {
    const { isAdmin, session, errorResponse } = await assertAdminApi(req);
    if (!isAdmin) return errorResponse;

    const body = await req.json();
    const supabase = createAdminClient();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    // 1. Bulk Import / Paste Mode
    if (typeof body.bulkText === "string") {
      const rawEntries = body.bulkText
        .split(/[\r\n,;]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);

      const validPincodes: string[] = [];
      const invalidEntries: string[] = [];

      for (const entry of rawEntries) {
        // Handle format: 302012 or "302012 - Jhotwara"
        const pinMatch = entry.match(/\b([1-9][0-9]{5})\b/);
        if (pinMatch) {
          validPincodes.push(pinMatch[1]);
        } else {
          invalidEntries.push(entry);
        }
      }

      const uniquePins = Array.from(new Set(validPincodes));
      if (uniquePins.length === 0) {
        return NextResponse.json(
          {
            error:
              "No valid 6-digit PIN codes found. PIN codes must be 6 digits and cannot start with 0.",
          },
          { status: 400 }
        );
      }

      const defaultArea = (body.defaultAreaName || "Jaipur Local Delivery Zone").trim();
      const insertRows = uniquePins.map((pin) => ({
        pincode: pin,
        area_name: defaultArea,
        is_active: true,
      }));

      const { error: upsertError } = await supabase
        .from("cod_pincodes")
        .upsert(insertRows as any, { onConflict: "pincode" });

      if (upsertError) {
        console.error("[Bulk Upsert Error]", upsertError);
        return NextResponse.json(
          { error: `Database error: ${upsertError.message}` },
          { status: 500 }
        );
      }

      await logAdminAudit({
        adminEmail: session?.email || "admin",
        action: "cod_pincodes_bulk_import",
        target: `imported_${uniquePins.length}_pincodes`,
        ip,
        success: true,
      });

      return NextResponse.json({
        success: true,
        count: uniquePins.length,
        message: `Successfully configured ${uniquePins.length} PIN codes.`,
        skippedInvalid: invalidEntries,
      });
    }

    // 2. Single PIN code Add Mode
    const pincode = String(body.pincode || "").trim();
    const areaName = String(body.areaName || "Jaipur Area").trim();
    const isActive = body.isActive !== false;

    if (!isValidIndianPincode(pincode)) {
      return NextResponse.json(
        { error: "Invalid PIN code format. Must be exactly 6 digits and cannot start with 0." },
        { status: 400 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("cod_pincodes")
      .upsert(
        {
          pincode,
          area_name: areaName,
          is_active: isActive,
        } as any,
        { onConflict: "pincode" }
      )
      .select()
      .single();

    if (insertError) {
      console.error("[Single Insert Error]", insertError);
      return NextResponse.json(
        { error: `Failed to save PIN code: ${insertError.message}` },
        { status: 500 }
      );
    }

    await logAdminAudit({
      adminEmail: session?.email || "admin",
      action: "cod_pincode_create",
      target: `pincode_${pincode}`,
      ip,
      success: true,
    });

    return NextResponse.json({ success: true, item: inserted });
  } catch (err: any) {
    console.error("[Admin COD Pincodes POST Error]", err);
    return NextResponse.json({ error: "Failed to create COD PIN code." }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/cod-pincodes
 * Toggle active state or update area name for an existing PIN code.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { isAdmin, session, errorResponse } = await assertAdminApi(req);
    if (!isAdmin) return errorResponse;

    const body = await req.json();
    const pincode = String(body.pincode || "").trim();

    if (!isValidIndianPincode(pincode)) {
      return NextResponse.json({ error: "Valid 6-digit pincode is required." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.isActive === "boolean") {
      updates.is_active = body.isActive;
    }
    if (typeof body.areaName === "string" && body.areaName.trim()) {
      updates.area_name = body.areaName.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields provided to update." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: updated, error } = await supabase
      .from("cod_pincodes")
      .update(updates as any)
      .eq("pincode", pincode)
      .select()
      .single();

    if (error) {
      console.error("[Pincode PATCH Error]", error);
      return NextResponse.json({ error: `Update failed: ${error.message}` }, { status: 500 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    await logAdminAudit({
      adminEmail: session?.email || "admin",
      action: "cod_pincode_update",
      target: `pincode_${pincode}_active_${updates.is_active}`,
      ip,
      success: true,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    console.error("[Admin COD Pincodes PATCH Error]", err);
    return NextResponse.json({ error: "Failed to update PIN code." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/cod-pincodes
 * Remove a PIN code from the local delivery list.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { isAdmin, session, errorResponse } = await assertAdminApi(req);
    if (!isAdmin) return errorResponse;

    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get("pincode")?.trim();

    if (!pincode || !isValidIndianPincode(pincode)) {
      return NextResponse.json({ error: "Valid 6-digit pincode is required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("cod_pincodes").delete().eq("pincode", pincode);

    if (error) {
      console.error("[Pincode DELETE Error]", error);
      return NextResponse.json({ error: `Delete failed: ${error.message}` }, { status: 500 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    await logAdminAudit({
      adminEmail: session?.email || "admin",
      action: "cod_pincode_delete",
      target: `pincode_${pincode}`,
      ip,
      success: true,
    });

    return NextResponse.json({ success: true, pincode });
  } catch (err: any) {
    console.error("[Admin COD Pincodes DELETE Error]", err);
    return NextResponse.json({ error: "Failed to delete PIN code." }, { status: 500 });
  }
}
