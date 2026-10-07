import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (body.confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Confirmation keyword must be exactly DELETE." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const userId = user.id;

    // 1. Orders are KEPT for accounting but detached from the user (user_id set to null)
    const { error: detachError } = await adminSupabase
      .from("orders")
      .update({ user_id: null } as any)
      .eq("user_id", userId);

    if (detachError) {
      console.warn("[Account Deletion] Error detaching orders:", detachError);
    }

    // 2. Remove avatar files from avatars bucket
    try {
      const { data: files } = await adminSupabase.storage.from("avatars").list(userId);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${userId}/${f.name}`);
        await adminSupabase.storage.from("avatars").remove(paths);
      }
    } catch (storageErr) {
      console.warn("[Account Deletion] Error removing avatar files:", storageErr);
    }

    // 3. Delete saved addresses
    const { error: addrError } = await adminSupabase
      .from("addresses")
      .delete()
      .eq("user_id", userId);

    if (addrError) {
      console.warn("[Account Deletion] Error deleting addresses:", addrError);
    }

    // 4. Delete profile row
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.warn("[Account Deletion] Error deleting profile:", profileError);
    }

    // 5. Delete Supabase Auth user record
    const { error: userDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);
    if (userDeleteError) {
      console.error("[Account Deletion] Error deleting auth user:", userDeleteError);
      return NextResponse.json(
        { error: userDeleteError.message || "Failed to completely delete account credentials." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Account deleted successfully." });
  } catch (err: any) {
    console.error("[Account Deletion Exception]", err);
    return NextResponse.json(
      { error: err.message || "Failed to process account deletion." },
      { status: 500 }
    );
  }
}
