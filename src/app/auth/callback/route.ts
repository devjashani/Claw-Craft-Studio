import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") || "/account";

  // Prevent open redirect vulnerabilities: ensure next starts with '/' and not '//'
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  // Rate limiting based on IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rateLimit = checkRateLimit(`auth-callback:${ip}`, 30, 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Too many attempts. Please try again later.")}`, requestUrl.origin)
    );
  }

  if (code) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[Auth Callback Error]", error.message);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }

      const user = data?.user;
      // Step 7: Optional server-side "claim past orders":
      // After a user's email is VERIFIED, link earlier guest orders with the same email (user_id is null) to the account.
      // Only run for verified emails.
      if (user && user.email) {
        const isEmailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
        if (isEmailVerified) {
          try {
            const adminSupabase = createAdminClient();
            await adminSupabase
              .from("orders")
              .update({ user_id: user.id } as any)
              .is("user_id", null)
              .ilike("email", user.email.trim());
          } catch (claimErr) {
            console.warn("[Claim Past Orders Warning]", claimErr);
            // Non-blocking: account login proceeds even if order claim fails
          }
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (err: any) {
      console.error("[Auth Callback Exception]", err);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Authentication failed. Please try again.")}`, requestUrl.origin)
      );
    }
  }

  // If no code was provided
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
