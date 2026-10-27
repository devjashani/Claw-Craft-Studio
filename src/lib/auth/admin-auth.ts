import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatIST } from "@/lib/custom-requests/constants";
import {
  sendAdminLoginSuccessEmail,
  sendAdminLoginLockoutAlertEmail,
} from "@/lib/resend";

export const ADMIN_COOKIE_NAME = "clawcraft_admin_session_v2";
export const OLD_ADMIN_COOKIE_NAME = "clawcraft_admin_session";

// Session Timeouts
export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle timeout
export const ADMIN_ABSOLUTE_LIFETIME_MS = 12 * 60 * 60 * 1000; // 12 hours absolute maximum lifetime

export interface AdminUser {
  id?: string;
  email: string;
  role: "artisan_admin";
  aal: "aal1" | "aal2";
  factorId?: string;
}

export interface AdminSessionPayload {
  sub: string;
  email: string;
  aal: "aal1" | "aal2";
  factorId?: string;
  iat: number; // Issued at timestamp
  act: number; // Last active timestamp
}

// In-Memory Rate Limiting & Lockout Tracker
interface LoginAttemptRecord {
  failures: number;
  lastFailure: number;
  lockedUntil: number;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();

setInterval(() => {
  const now = Date.now();
  loginAttempts.forEach((record, key) => {
    if (now - record.lastFailure > 60 * 60 * 1000 && now > record.lockedUntil) {
      loginAttempts.delete(key);
    }
  });
}, 10 * 60 * 1000).unref?.();

/**
 * Get the server-only cryptographic signing secret.
 * Never exposed to browser bundles.
 */
function getSigningSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "clawcraft_admin_session_sec_key_production_vault";
  return secret;
}

/**
 * Hash an IP address for privacy-safe storage and logs.
 */
export function hashIp(ip: string): string {
  const salt = process.env.ADMIN_SESSION_SECRET || "clawcraft_ip_salt";
  return crypto.createHmac("sha256", salt).update(ip).digest("hex").slice(0, 16);
}

/**
 * Mask an IP address for readable alerts and UI (e.g. 103.21.***.***).
 */
export function maskIp(ip: string): string {
  if (!ip || ip === "::1" || ip === "localhost") return "127.0.0.1 (Local)";
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 2).join(":")}:****:****`;
  }
  return ip.slice(0, 4) + "****";
}

/**
 * Validates if an email is in the server-side ADMIN_EMAILS allow-list.
 * Never relies on client-editable user_metadata or hard-coded defaults in production.
 */
export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const rawList = process.env.ADMIN_EMAILS;
  if (!rawList) {
    if (process.env.NODE_ENV === "production") {
      console.error("[CRITICAL SECURITY] ADMIN_EMAILS is not configured in production!");
    }
    return false;
  }
  const allowedList = rawList
    .split(",")
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);
  return allowedList.includes(normalized);
}

/**
 * Validates if a user object has an authorized admin email.
 */
export function isUserAdmin(
  user?: { email?: string | null } | null
): boolean {
  return isAllowedAdminEmail(user?.email);
}

/**
 * Create a cryptographically signed session token.
 */
export function createSignedAdminToken(payload: AdminSessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verify and decode a cryptographically signed admin session token.
 * Validates HMAC signature, idle timeout (30m), absolute timeout (12h), and allowlist.
 */
export function verifySignedAdminToken(token?: string | null): AdminSessionPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(data)
    .digest("base64url");

  // Constant-time signature verification
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(data, "base64url").toString("utf-8");
    const payload: AdminSessionPayload = JSON.parse(jsonStr);

    if (!payload.email || !payload.sub || !payload.iat || !payload.act) {
      return null;
    }

    const now = Date.now();

    // 1. Check 30-minute idle timeout
    if (now - payload.act > ADMIN_IDLE_TIMEOUT_MS) {
      return null;
    }

    // 2. Check 12-hour absolute lifetime
    if (now - payload.iat > ADMIN_ABSOLUTE_LIFETIME_MS) {
      return null;
    }

    // 3. Verify email is still allowed
    if (!isAllowedAdminEmail(payload.email)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Login Rate Limiting & Lockout Check.
 */
export function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  remainingLockoutSeconds: number;
  requiresCaptcha: boolean;
} {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) {
    return { allowed: true, remainingLockoutSeconds: 0, requiresCaptcha: false };
  }

  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingLockoutSeconds: remainingSeconds, requiresCaptcha: true };
  }

  return {
    allowed: true,
    remainingLockoutSeconds: 0,
    requiresCaptcha: record.failures >= 3,
  };
}

/**
 * Register a failed login attempt. Enforces a 15-minute lockout at 5 failures.
 */
export async function recordFailedLoginAttempt(
  ip: string,
  email: string
): Promise<{ lockedOut: boolean; failures: number }> {
  const now = Date.now();
  const ipKey = `ip_${ip}`;
  const emailKey = `email_${email.toLowerCase().trim()}`;

  for (const key of [ipKey, emailKey]) {
    const record = loginAttempts.get(key) || { failures: 0, lastFailure: now, lockedUntil: 0 };
    record.failures += 1;
    record.lastFailure = now;

    if (record.failures >= 5) {
      record.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
    }

    loginAttempts.set(key, record);
  }

  const currentRecord = loginAttempts.get(ipKey)!;
  const lockedOut = currentRecord.failures >= 5;

  // Send security alert email on lockout
  if (lockedOut && currentRecord.failures === 5) {
    try {
      await sendAdminLoginLockoutAlertEmail({
        ip: maskIp(ip),
        attempts: currentRecord.failures,
        istTime: formatIST(new Date()),
        attemptedEmail: email,
      });
    } catch (err) {
      console.error("[Security Alert Email Error]", err);
    }
  }

  return { lockedOut, failures: currentRecord.failures };
}

/**
 * Reset failed login attempts on successful authentication.
 */
export function resetLoginAttempts(ip: string, email: string) {
  loginAttempts.delete(`ip_${ip}`);
  loginAttempts.delete(`email_${email.toLowerCase().trim()}`);
}

/**
 * Log an event to the admin_audit_log table.
 */
export async function logAdminAudit({
  adminEmail,
  action,
  target,
  ip,
  userAgent,
  success = true,
}: {
  adminEmail: string;
  action: string;
  target?: string;
  ip?: string;
  userAgent?: string;
  success?: boolean;
}) {
  try {
    const supabase = createAdminClient();
    const ipHash = ip ? hashIp(ip) : null;
    await supabase.from("admin_audit_log").insert({
      admin_email: adminEmail.toLowerCase().trim(),
      action,
      target: target || null,
      ip_hash: ipHash,
      user_agent: userAgent?.slice(0, 255) || null,
      success,
    } as any);
  } catch (err) {
    // If the table hasn't been migrated yet, do not break application operations
    console.warn("[Admin Audit Log Notice]", action, err instanceof Error ? err.message : err);
  }
}

/**
 * Server-only helper: requireAdmin().
 * Returns the verified admin or throws 401/403 or redirects to login.
 */
export async function requireAdmin(options?: {
  requireMfa?: boolean;
  isApi?: boolean;
}): Promise<AdminUser> {
  const cookieStore = cookies();

  // Reject and clear any old insecure demo cookies
  if (cookieStore.get(OLD_ADMIN_COOKIE_NAME)) {
    try {
      cookieStore.delete(OLD_ADMIN_COOKIE_NAME);
    } catch {
      // ignore
    }
  }

  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  const tokenPayload = verifySignedAdminToken(sessionCookie?.value);

  const isApi = Boolean(options?.isApi);
  const enforceMfa =
    options?.requireMfa || process.env.ADMIN_REQUIRE_MFA === "true";

  if (!tokenPayload) {
    if (isApi) {
      throw new Error("UNAUTHORIZED_ADMIN");
    }
    redirect("/admin/login");
  }

  // Double-verify against live Supabase Auth session
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user || !user.email) {
      if (isApi) throw new Error("UNAUTHORIZED_ADMIN");
      redirect("/admin/login");
    }

    // Require confirmed email
    if (!user.email_confirmed_at) {
      if (isApi) throw new Error("EMAIL_UNCONFIRMED");
      redirect("/admin/login");
    }

    // Require email in ADMIN_EMAILS
    if (!isAllowedAdminEmail(user.email)) {
      if (isApi) throw new Error("FORBIDDEN_NOT_ADMIN");
      redirect("/admin/login");
    }

    // Verify MFA if required
    if (enforceMfa && tokenPayload.aal !== "aal2") {
      if (isApi) throw new Error("MFA_REQUIRED");
      redirect("/admin/login?step=mfa");
    }

    return {
      id: user.id,
      email: user.email.toLowerCase().trim(),
      role: "artisan_admin",
      aal: tokenPayload.aal,
      factorId: tokenPayload.factorId,
    };
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    if (isApi) {
      throw new Error("UNAUTHORIZED_ADMIN");
    }
    redirect("/admin/login");
  }
}

/**
 * Server-side guard for admin API endpoints.
 * Returns 401/403 with strict security headers if unauthenticated.
 */
export async function assertAdminApi(req?: NextRequest): Promise<{
  isAdmin: boolean;
  session: AdminUser | null;
  errorResponse?: NextResponse;
}> {
  try {
    const admin = await requireAdmin({ isApi: true });
    return { isAdmin: true, session: admin };
  } catch (err: any) {
    const code = err instanceof Error ? err.message : "UNAUTHORIZED";
    const status = code === "MFA_REQUIRED" || code === "FORBIDDEN_NOT_ADMIN" ? 403 : 401;
    const errorMsg =
      code === "MFA_REQUIRED"
        ? "Two-factor authentication (TOTP) is required."
        : "Unauthorized: Administrator privileges required.";

    const response = NextResponse.json(
      { error: errorMsg, code },
      { status }
    );

    // Enforce security headers on admin API responses
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "no-referrer");

    return { isAdmin: false, session: null, errorResponse: response };
  }
}

/**
 * Backwards-compatibility wrapper for pages reading session without throwing.
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    return await requireAdmin({ isApi: true });
  } catch {
    return null;
  }
}

/**
 * Verify request origin on admin mutation requests (POST, PUT, PATCH, DELETE).
 */
export function verifyAdminRequestOrigin(req: NextRequest): boolean {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return true;
  }

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin || !host) return true; // Standard non-browser or direct call

  try {
    const originHost = new URL(origin).host;
    return originHost.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}
