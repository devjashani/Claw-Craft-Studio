import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/auth/admin-auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only intercept /admin routes
  if (pathname.startsWith("/admin")) {
    const adminSessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const hasAdminSession = Boolean(
      adminSessionCookie === "active" ||
        adminSessionCookie?.startsWith("user_") ||
        req.cookies.get("sb-access-token")?.value
    );

    // If user is visiting /admin/login
    if (pathname === "/admin/login") {
      if (hasAdminSession) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    // If unauthenticated on any other /admin route
    if (!hasAdminSession) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
