import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
    const rl = checkRateLimit(`account_orders_${user.id}`, 60, 60000);
    if (!rl.success) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    // Server-side query using admin client with strict user_id filtering
    const adminSupabase = createAdminClient();
    const { data: orders, error: ordersError } = await adminSupabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, total_paise, subtotal_paise, shipping_fee_paise, discount_paise, created_at, customer_name, customer_email, public_token"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("[Account Orders Error]", ordersError);
      return NextResponse.json({ error: "Failed to retrieve orders." }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (err: any) {
    console.error("[Account Orders Exception]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
