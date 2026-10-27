import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "clawcraft_admin_session_v2";
export const OLD_ADMIN_COOKIE_NAME = "clawcraft_admin_session";

// Session Timeouts
export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle timeout
export const ADMIN_ABSOLUTE_LIFETIME_MS = 12 * 60 * 60 * 1000; // 12 hours absolute maximum lifetime

export interface AdminSessionPayload {
  sub: string;
  email: string;
  aal: "aal1" | "aal2";
  factorId?: string;
  iat: number; // Issued at timestamp
  act: number; // Last active timestamp
}

/**
 * Get server-side cryptographic signing secret.
 */
export function getAdminSigningSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "clawcraft_admin_session_sec_key_production_vault"
  );
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function constantTimeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Edge-compatible HMAC-SHA256 calculation using Web Crypto API.
 */
async function computeHmacSha256(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const uint8 = new Uint8Array(sigBuffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Edge-compatible token verification using Web Crypto API.
 * Rejects old demo cookies, expired sessions, and tampered signatures.
 */
export async function verifySignedAdminTokenEdge(
  token?: string | null
): Promise<AdminSessionPayload | null> {
  if (!token || typeof token !== "string") return null;

  // Immediately reject old demo cookies
  if (
    token === "active" ||
    token.startsWith("user_") ||
    !token.includes(".")
  ) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [dataB64, signature] = parts;
  if (!dataB64 || !signature) return null;

  try {
    const expectedSig = await computeHmacSha256(getAdminSigningSecret(), dataB64);
    if (!constantTimeStringEqual(signature, expectedSig)) {
      return null;
    }

    // Decode base64url JSON
    const base64 = dataB64.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr) as AdminSessionPayload;

    if (!payload.sub || !payload.email || !payload.iat || !payload.act) {
      return null;
    }

    const now = Date.now();

    // Check 30-minute idle timeout
    if (now - payload.act > ADMIN_IDLE_TIMEOUT_MS) {
      return null;
    }

    // Check 12-hour absolute lifetime
    if (now - payload.iat > ADMIN_ABSOLUTE_LIFETIME_MS) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Verify Request Origin header against Host on mutation requests.
 */
export function verifyAdminRequestOrigin(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin || !host) {
    const referer = req.headers.get("referer");
    if (!referer) return false;
    try {
      const refUrl = new URL(referer);
      return refUrl.host === host;
    } catch {
      return false;
    }
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}
