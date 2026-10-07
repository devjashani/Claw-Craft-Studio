import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isAllowedAdminEmail } from "@/lib/auth/admin-auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, demo } = body;

    // Handle 1-click Studio Demo Login for test/development review
    if (demo === true) {
      const response = NextResponse.json({
        success: true,
        user: { email: "studio@clawcraft.in", role: "artisan_admin", isDemo: true },
      });

      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: `user_${encodeURIComponent("studio@clawcraft.in")}`,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Try Supabase Auth first if live credentials exist
    let supabaseSuccess = false;
    let authenticatedEmail = email;

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        supabaseSuccess = true;
        authenticatedEmail = data.user.email || email;
      }
    } catch {
      // Supabase disconnected or mock credentials
    }

    // Check default studio admin master password
    const masterPassword = process.env.ADMIN_PASSWORD || "clawcraft2026";
    const normalizedInputEmail = email.trim().toLowerCase();
    const isMasterPasswordMatch =
      (normalizedInputEmail === "admin@clawcraft.in" || normalizedInputEmail === "studio@clawcraft.in") &&
      password === masterPassword;

    if (isMasterPasswordMatch) {
      authenticatedEmail = normalizedInputEmail;
    }

    // Verify that the email is in the admin allow-list
    const isAllowed = isAllowedAdminEmail(authenticatedEmail);

    if ((supabaseSuccess && isAllowed) || isMasterPasswordMatch) {
      const response = NextResponse.json({
        success: true,
        user: { email: authenticatedEmail, role: "artisan_admin" },
      });

      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: `user_${encodeURIComponent(authenticatedEmail)}`,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    if (supabaseSuccess && !isAllowed) {
      return NextResponse.json(
        { error: "Access denied. Customer accounts do not have administrator permissions." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Invalid credentials. Use studio@clawcraft.in or standard admin credentials." },
      { status: 401 }
    );
  } catch (error) {
    console.error("[Admin Auth Error]", error);
    return NextResponse.json(
      { error: "Authentication system error. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    const response = NextResponse.json({ success: true, message: "Logged out" });
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: "",
      path: "/",
      httpOnly: true,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("[Admin Logout Error]", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME);
  if (adminCookie?.value) {
    return NextResponse.json({
      authenticated: true,
      user: {
        email: adminCookie.value.startsWith("user_")
          ? decodeURIComponent(adminCookie.value.replace("user_", ""))
          : "studio@clawcraft.in",
      },
    });
  }

  return NextResponse.json({ authenticated: false, user: null });
}
