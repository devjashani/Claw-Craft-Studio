import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_COOKIE_NAME = "clawcraft_admin_session";

export interface AdminUser {
  email: string;
  role: string;
  isDemo?: boolean;
}

export async function getAdminSession(): Promise<AdminUser | null> {
  const cookieStore = cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  // 1. Check direct admin session cookie
  if (adminCookie?.value === "active" || adminCookie?.value.startsWith("user_")) {
    const email = adminCookie.value.startsWith("user_")
      ? decodeURIComponent(adminCookie.value.replace("user_", ""))
      : "studio@clawcraft.in";
    return {
      email,
      role: "artisan_admin",
      isDemo: adminCookie.value === "active",
    };
  }

  // 2. Check Supabase Auth session
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && user.email) {
      return {
        email: user.email,
        role: "artisan_admin",
      };
    }
  } catch {
    // In mock or disconnected state
  }

  return null;
}
