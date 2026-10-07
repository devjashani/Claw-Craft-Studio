import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isAllowedAdminEmail } from "@/lib/auth/admin-auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Intercept Admin API Routes (/api/admin/...)
  if (pathname.startsWith("/api/admin")) {
    // Allow admin authentication endpoint itself
    if (pathname === "/api/admin/auth") {
      return NextResponse.next();
    }

    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    let hasValidAdminSession = false;

    if (adminCookie === "active" && process.env.NODE_ENV !== "production") {
      hasValidAdminSession = true;
    } else if (adminCookie?.startsWith("user_")) {
      const email = decodeURIComponent(adminCookie.replace("user_", ""));
      hasValidAdminSession = isAllowedAdminEmail(email);
    }

    if (!hasValidAdminSession) {
      return NextResponse.json(
        {
          error: "Forbidden: You do not have artisan admin privileges.",
          code: "FORBIDDEN_ADMIN_API",
        },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // 2. Intercept Admin UI Routes (/admin/...)
  if (pathname.startsWith("/admin")) {
    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    let hasValidAdminSession = false;

    if (adminCookie === "active" && process.env.NODE_ENV !== "production") {
      hasValidAdminSession = true;
    } else if (adminCookie?.startsWith("user_")) {
      const email = decodeURIComponent(adminCookie.replace("user_", ""));
      hasValidAdminSession = isAllowedAdminEmail(email);
    }

    // Visiting /admin/login
    if (pathname === "/admin/login") {
      if (hasValidAdminSession) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    // If unauthenticated or regular customer on any other /admin page
    if (!hasValidAdminSession) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
