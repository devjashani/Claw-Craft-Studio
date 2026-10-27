import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  OLD_ADMIN_COOKIE_NAME,
  isAllowedAdminEmail,
  createSignedAdminToken,
  verifySignedAdminToken,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginAttempts,
  logAdminAudit,
  maskIp,
} from "@/lib/auth/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { formatIST } from "@/lib/custom-requests/constants";
import { sendAdminLoginSuccessEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

const GENERIC_AUTH_ERROR = "Invalid email or password.";

/**
 * Verify Cloudflare Turnstile token if configured.
 */
async function verifyTurnstileToken(token?: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Turnstile not enabled on server
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip || "",
      }),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "Unknown Client";

  try {
    const body = await req.json();
    const { email, password, totpCode, factorId, turnstileToken, demo } = body;

    // Local-only development test helper: STRICTLY gated to localhost and non-production
    if (
      process.env.NODE_ENV === "development" &&
      process.env.ALLOW_DEMO_ADMIN === "true" &&
      (req.headers.get("host")?.includes("localhost") || req.headers.get("host")?.includes("127.0.0.1")) &&
      demo === true
    ) {
      const allowedEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const devEmail = allowedEmails[0] || "dev-local@localhost";
      const token = createSignedAdminToken({
        sub: "local-dev-admin-id",
        email: devEmail,
        aal: "aal2",
        iat: Date.now(),
        act: Date.now(),
      });

      const res = NextResponse.json({
        success: true,
        user: { email: devEmail, role: "artisan_admin", aal: "aal2" },
      });

      res.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: token,
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 12, // 12 hours
      });

      return res;
    }

    // Rate Limiting & Lockout Check per IP & Email
    const ipLimit = checkLoginRateLimit(`ip_${ip}`);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Account locked for ${ipLimit.remainingLockoutSeconds}s.`,
          code: "ACCOUNT_LOCKED",
        },
        { status: 429 }
      );
    }

    if (!email || !password) {
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailLimit = checkLoginRateLimit(`email_${normalizedEmail}`);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Account locked for ${emailLimit.remainingLockoutSeconds}s.`,
          code: "ACCOUNT_LOCKED",
        },
        { status: 429 }
      );
    }

    // Require CAPTCHA if attempts >= 3 and site key is configured
    if ((ipLimit.requiresCaptcha || emailLimit.requiresCaptcha) && process.env.TURNSTILE_SECRET_KEY) {
      const isCaptchaValid = await verifyTurnstileToken(turnstileToken, ip);
      if (!isCaptchaValid) {
        return NextResponse.json(
          {
            error: "Security verification failed. Please complete the CAPTCHA.",
            requiresCaptcha: true,
          },
          { status: 400 }
        );
      }
    }

    // Supabase Authentication (Email + Password only)
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData.user) {
      await recordFailedLoginAttempt(ip, normalizedEmail);
      await logAdminAudit({
        adminEmail: normalizedEmail,
        action: "login_failure",
        target: "password_invalid",
        ip,
        userAgent,
        success: false,
      });

      const updatedLimit = checkLoginRateLimit(`ip_${ip}`);
      return NextResponse.json(
        {
          error: GENERIC_AUTH_ERROR,
          requiresCaptcha: updatedLimit.requiresCaptcha,
        },
        { status: 401 }
      );
    }

    const user = authData.user;
    const userEmail = (user.email || normalizedEmail).toLowerCase().trim();

    // 1. Enforce confirmed email
    if (!user.email_confirmed_at) {
      await supabase.auth.signOut();
      await recordFailedLoginAttempt(ip, userEmail);
      await logAdminAudit({
        adminEmail: userEmail,
        action: "login_failure",
        target: "email_not_confirmed",
        ip,
        userAgent,
        success: false,
      });
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
    }

    // 2. Enforce ADMIN_EMAILS server allowlist
    const isAllowed = isAllowedAdminEmail(userEmail);
    if (!isAllowed) {
      await supabase.auth.signOut();
      await recordFailedLoginAttempt(ip, userEmail);
      await logAdminAudit({
        adminEmail: userEmail,
        action: "login_failure",
        target: "forbidden_customer_account",
        ip,
        userAgent,
        success: false,
      });
      // Generic error so customer accounts do not learn of admin existence
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
    }

    // 3. Two-Factor Authentication (TOTP) Verification
    const enforceMfa = process.env.ADMIN_REQUIRE_MFA === "true";
    let factorsList: any[] = [];
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      factorsList = factors?.totp || [];
    } catch {
      // MFA list factors fallback
    }

    const verifiedFactor = factorsList.find((f: any) => f.status === "verified");
    const hasEnrolledMfa = Boolean(verifiedFactor);

    if (enforceMfa || hasEnrolledMfa) {
      if (hasEnrolledMfa) {
        const targetFactorId = factorId || verifiedFactor.id;

        // If client hasn't submitted a 6-digit TOTP code yet, prompt for code
        if (!totpCode) {
          return NextResponse.json({
            success: false,
            step: "mfa_required",
            factorId: targetFactorId,
            message: "Please enter your 6-digit authenticator code.",
          });
        }

        // Verify the provided TOTP code
        const { data: challengeData, error: challengeError } =
          await supabase.auth.mfa.challengeAndVerify({
            factorId: targetFactorId,
            code: totpCode.trim(),
          });

        if (challengeError || !challengeData) {
          await recordFailedLoginAttempt(ip, userEmail);
          await logAdminAudit({
            adminEmail: userEmail,
            action: "login_failure",
            target: "mfa_code_invalid",
            ip,
            userAgent,
            success: false,
          });
          return NextResponse.json(
            { error: "Invalid authenticator code. Please check your app and try again." },
            { status: 401 }
          );
        }
      } else if (enforceMfa && !hasEnrolledMfa) {
        // Enforced in env, but account hasn't enrolled yet
        console.warn(
          `[MFA Warning] ADMIN_REQUIRE_MFA is enabled, but admin ${userEmail} has not enrolled TOTP yet.`
        );
      }
    }

    // Success: Reset rate-limiting counters
    resetLoginAttempts(ip, userEmail);

    const aalLevel = hasEnrolledMfa && totpCode ? "aal2" : "aal1";
    const sessionToken = createSignedAdminToken({
      sub: user.id,
      email: userEmail,
      aal: aalLevel,
      factorId: verifiedFactor?.id,
      iat: Date.now(),
      act: Date.now(),
    });

    const response = NextResponse.json({
      success: true,
      user: { email: userEmail, role: "artisan_admin", aal: aalLevel },
    });

    // Set signed security cookie with Strict/Lax flags
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12 hours absolute lifetime
    });

    // Invalidate old demo cookie
    response.cookies.set({
      name: OLD_ADMIN_COOKIE_NAME,
      value: "",
      path: "/",
      httpOnly: true,
      maxAge: 0,
    });

    // Log successful login audit
    await logAdminAudit({
      adminEmail: userEmail,
      action: "login_success",
      target: aalLevel === "aal2" ? "password_plus_mfa" : "password_only",
      ip,
      userAgent,
      success: true,
    });

    // Notify owner on every successful admin login
    try {
      await sendAdminLoginSuccessEmail({
        adminEmail: userEmail,
        istTime: formatIST(new Date()),
        ip: maskIp(ip),
        userAgent,
      });
    } catch (err) {
      console.error("[Login Success Alert Error]", err);
    }

    return response;
  } catch (error) {
    console.error("[Admin Auth Fatal Error]", error);
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown Client";

    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = verifySignedAdminToken(adminCookie);

    if (session) {
      await logAdminAudit({
        adminEmail: session.email,
        action: "logout",
        target: "admin_manual_logout",
        ip,
        userAgent,
        success: true,
      });
    }

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    const response = NextResponse.json({ success: true, message: "Logged out" });

    // Clear all admin session cookies
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: "",
      path: "/",
      httpOnly: true,
      maxAge: 0,
    });

    response.cookies.set({
      name: OLD_ADMIN_COOKIE_NAME,
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
  const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = verifySignedAdminToken(adminCookie);

  if (session) {
    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.email,
        aal: session.aal,
      },
    });
  }

  return NextResponse.json({ authenticated: false, user: null });
}
