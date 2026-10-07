import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_COOKIE_NAME = "clawcraft_admin_session";

export interface AdminUser {
  email: string;
  role: string;
  isDemo?: boolean;
}

/**
 * Validates if an email is in the server-side ADMIN_EMAILS allow-list.
 * Never relies on client-editable user_metadata.
 */
export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const rawList =
    process.env.ADMIN_EMAILS ||
    "studio@clawcraft.in,admin@clawcraft.in,devjashani40@gmail.com,devjashani2004@gmail.com";
  const allowedList = rawList
    .split(",")
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);
  return allowedList.includes(normalized);
}

/**
 * Checks if a Supabase user is a verified administrator.
 * Only checks server-side allow-list OR service-role controlled app_metadata.
 * NEVER checks user_metadata.
 */
export function isUserAdmin(user: { email?: string | null; app_metadata?: Record<string, unknown> } | null): boolean {
  if (!user) return false;
  // 1. Strict Server-Side allow-list check
  if (user.email && isAllowedAdminEmail(user.email)) {
    return true;
  }
  // 2. Service-role controlled app_metadata (cannot be edited by client)
  if (user.app_metadata && (user.app_metadata.role === "admin" || user.app_metadata.role === "artisan_admin")) {
    return true;
  }
  return false;
}

export async function getAdminSession(): Promise<AdminUser | null> {
  const cookieStore = cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  // 1. Check direct admin session cookie
  if (adminCookie?.value) {
    if (adminCookie.value === "active" && process.env.NODE_ENV !== "production") {
      return {
        email: "studio@clawcraft.in",
        role: "artisan_admin",
        isDemo: true,
      };
    }
    if (adminCookie.value.startsWith("user_")) {
      const email = decodeURIComponent(adminCookie.value.replace("user_", ""));
      if (isAllowedAdminEmail(email)) {
        return {
          email,
          role: "artisan_admin",
        };
      }
    }
  }

  // 2. Check Supabase Auth session
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && isUserAdmin(user)) {
      return {
        email: user.email!,
        role: "artisan_admin",
      };
    }
  } catch {
    // In mock or disconnected state
  }

  return null;
}

/**
 * Server-side guard for admin API endpoints.
 * Returns 403 Forbidden if the requester is a logged-in customer or unauthenticated.
 */
export async function assertAdminApi(): Promise<{
  isAdmin: boolean;
  session: AdminUser | null;
  errorResponse?: NextResponse;
}> {
  const session = await getAdminSession();
  if (!session) {
    return {
      isAdmin: false,
      session: null,
      errorResponse: NextResponse.json(
        {
          error: "Forbidden: You do not have artisan admin privileges.",
          code: "UNAUTHORIZED_ADMIN",
        },
        { status: 403 }
      ),
    };
  }
  return { isAdmin: true, session };
}
