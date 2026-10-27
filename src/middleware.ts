import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  verifySignedAdminTokenEdge,
  verifyAdminRequestOrigin,
} from "@/lib/auth/admin-token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApiAdmin = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin");

  if (!isApiAdmin && !isAdminPage) {
    return NextResponse.next();
  }

  // Set request header with x-pathname for Server Component layout context
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  // Security headers to attach to all admin responses
  const attachSecurityHeaders = (res: NextResponse) => {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("Referrer-Policy", "no-referrer");
    res.headers.set("X-Content-Type-Options", "nosniff");
    return res;
  };

  // 1. Intercept Admin API Routes (/api/admin/...)
  if (isApiAdmin) {
    // Allow admin authentication endpoint itself
    if (pathname === "/api/admin/auth") {
      const res = NextResponse.next({ request: { headers: requestHeaders } });
      return attachSecurityHeaders(res);
    }

    // Origin check for mutation requests
    if (!verifyAdminRequestOrigin(req)) {
      const forbidden = NextResponse.json(
        { error: "Forbidden: Cross-site request rejected.", code: "CSRF_DETECTED" },
        { status: 403 }
      );
      return attachSecurityHeaders(forbidden);
    }

    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifySignedAdminTokenEdge(adminCookie);

    if (!session) {
      const unauth = NextResponse.json(
        {
          error: "Unauthorized: Active administrator session required.",
          code: "UNAUTHORIZED_ADMIN",
        },
        { status: 401 }
      );
      return attachSecurityHeaders(unauth);
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return attachSecurityHeaders(res);
  }

  // 2. Intercept Admin UI Pages (/admin/...)
  if (isAdminPage) {
    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifySignedAdminTokenEdge(adminCookie);

    // Visiting /admin/login
    if (pathname === "/admin/login") {
      if (session) {
        // If already authenticated, redirect to /admin dashboard
        const redirectRes = NextResponse.redirect(new URL("/admin", req.url));
        return attachSecurityHeaders(redirectRes);
      }
      const res = NextResponse.next({ request: { headers: requestHeaders } });
      return attachSecurityHeaders(res);
    }

    // Visiting any protected /admin page without valid signed session
    if (!session) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      const redirectRes = NextResponse.redirect(loginUrl);
      return attachSecurityHeaders(redirectRes);
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return attachSecurityHeaders(res);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
