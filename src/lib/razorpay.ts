import Razorpay from "razorpay";
import crypto from "crypto";
import { isProductionSite } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

export type RazorpayMode = "LIVE" | "TEST" | "MISSING" | "INVALID";

export interface RazorpayGatewayStatus {
  mode: RazorpayMode;
  isProduction: boolean;
  isTestKeyInProduction: boolean;
  isLiveKeyOutsideProduction: boolean;
  maskedKeyId: string;
  webhookSecretConfigured: boolean;
  lastWebhookReceivedAt: string | null;
  lastVerifiedPaymentAt: string | null;
  isGatewayReady: boolean;
  error?: string;
}

/**
 * Checks if the current execution is true production (Vercel production or production domain)
 */
export function isProductionPaymentEnv(): boolean {
  if (process.env.VERCEL_ENV === "production") return true;
  return isProductionSite();
}

/**
 * Detect mode strictly from Razorpay Key ID prefix
 */
export function getRazorpayKeyMode(keyId?: string | null): RazorpayMode {
  if (!keyId || !keyId.trim() || keyId.includes("placeholder")) {
    return "MISSING";
  }
  const clean = keyId.trim();
  if (clean.startsWith("rzp_live_")) return "LIVE";
  if (clean.startsWith("rzp_test_")) return "TEST";
  return "INVALID";
}

/**
 * Masks key ID for display: e.g. rzp_live_****abcd (Never show secrets)
 */
export function maskRazorpayKeyId(keyId?: string | null): string {
  if (!keyId || !keyId.trim() || keyId.includes("placeholder")) {
    return "Not configured";
  }
  const clean = keyId.trim();
  const prefix = clean.startsWith("rzp_live_")
    ? "rzp_live_"
    : clean.startsWith("rzp_test_")
    ? "rzp_test_"
    : "rzp_";
  const suffix = clean.slice(-4);
  return `${prefix}****${suffix}`;
}

/**
 * Checks if payment simulation is permitted.
 * Condition:
 * ONLY when NODE_ENV is "development", request host is localhost, and ALLOW_PAYMENT_SIMULATION=true.
 * It is impossible to enable in production.
 */
export function isPaymentSimulationAllowed(reqHost?: string | null): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.ALLOW_PAYMENT_SIMULATION !== "true") return false;
  if (!reqHost) return false;
  const host = reqHost.toLowerCase().split(":")[0];
  return host === "localhost" || host === "127.0.0.1";
}

/**
 * Validates Razorpay credentials for the active environment.
 * - In production: REQUIRES rzp_live_ key and secret. Rejects rzp_test_ keys.
 * - Outside production: REQUIRES rzp_test_ key. Rejects rzp_live_ keys to prevent accidental charges.
 */
export function validateRazorpayEnvironment(): {
  isValid: boolean;
  mode: RazorpayMode;
  errorType?:
    | "MISSING_KEYS_IN_PRODUCTION"
    | "TEST_KEYS_IN_PRODUCTION"
    | "LIVE_KEYS_OUTSIDE_PRODUCTION"
    | "MISSING_KEYS_DEV"
    | "INVALID_KEY_FORMAT";
  customerMessage: string;
  adminLogMessage: string;
} {
  const isProd = isProductionPaymentEnv();
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
  const mode = getRazorpayKeyMode(keyId);
  const secretPresent = Boolean(keySecret && !keySecret.includes("placeholder"));

  if (isProd) {
    if (mode === "MISSING" || !secretPresent) {
      return {
        isValid: false,
        mode,
        errorType: "MISSING_KEYS_IN_PRODUCTION",
        customerMessage:
          "Payments are temporarily unavailable. Please try again soon or message us on WhatsApp",
        adminLogMessage:
          "[Razorpay Critical Error] Live Razorpay credentials (rzp_live_...) are missing in production environment.",
      };
    }
    if (mode === "TEST") {
      return {
        isValid: false,
        mode: "TEST",
        errorType: "TEST_KEYS_IN_PRODUCTION",
        customerMessage:
          "Payments are temporarily unavailable. Please try again soon or message us on WhatsApp",
        adminLogMessage:
          "[Razorpay Critical Guard] Razorpay is in TEST mode (rzp_test_ key found in production). Refusing to create orders.",
      };
    }
    if (mode === "INVALID") {
      return {
        isValid: false,
        mode: "INVALID",
        errorType: "INVALID_KEY_FORMAT",
        customerMessage:
          "Payments are temporarily unavailable. Please try again soon or message us on WhatsApp",
        adminLogMessage:
          "[Razorpay Configuration Error] NEXT_PUBLIC_RAZORPAY_KEY_ID does not match expected rzp_live_ format.",
      };
    }
    return {
      isValid: true,
      mode: "LIVE",
      customerMessage: "",
      adminLogMessage: "",
    };
  } else {
    // Outside production (preview / dev)
    if (mode === "LIVE") {
      return {
        isValid: false,
        mode: "LIVE",
        errorType: "LIVE_KEYS_OUTSIDE_PRODUCTION",
        customerMessage:
          "Live Razorpay keys are not permitted in development or preview environments to avoid accidental real charges.",
        adminLogMessage:
          "[Razorpay Safety Guard] Rejected rzp_live_ key on non-production deployment.",
      };
    }
    if (mode === "MISSING" || !secretPresent) {
      return {
        isValid: false,
        mode: "MISSING",
        errorType: "MISSING_KEYS_DEV",
        customerMessage:
          "Payments are not configured. Please add test credentials (rzp_test_...) in .env.local",
        adminLogMessage:
          "[Razorpay Notice] Missing or placeholder test credentials in development environment.",
      };
    }
    return {
      isValid: true,
      mode: "TEST",
      customerMessage: "",
      adminLogMessage: "",
    };
  }
}

/**
 * Returns an authenticated Razorpay SDK instance.
 * Throws if the configuration violates the environment guard.
 */
export function getRazorpayClient(): Razorpay {
  const guard = validateRazorpayEnvironment();
  if (!guard.isValid) {
    throw new Error(guard.adminLogMessage || guard.customerMessage);
  }

  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET!.trim();

  return new Razorpay({
    key_id,
    key_secret,
  });
}

/**
 * Constant-time HMAC-SHA256 verification of Razorpay checkout signature:
 * HMAC(order_id + "|" + payment_id, secret) === signature
 * Never allows mocks, test bypasses, or fallback signatures.
 */
export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!orderId || !paymentId || !signature) return false;

  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret || secret.includes("placeholder")) {
    console.error("[Razorpay Verify] Cannot verify signature: RAZORPAY_KEY_SECRET is missing.");
    return false;
  }

  try {
    const text = `${orderId}|${paymentId}`;
    const generated = crypto
      .createHmac("sha256", secret)
      .update(text)
      .digest("hex");

    const expectedBuf = Buffer.from(generated, "utf8");
    const actualBuf = Buffer.from(signature, "utf8");

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error("[Razorpay Verify] Crypto timingSafeEqual error:", err);
    return false;
  }
}

/**
 * Constant-time HMAC-SHA256 verification of Razorpay webhook signature:
 * HMAC(rawBody, webhookSecret) === signature
 */
export function verifyWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): boolean {
  if (!rawBody || !signature) return false;

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret || webhookSecret.includes("placeholder")) {
    console.error("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured. Webhook rejected.");
    return false;
  }

  try {
    const generated = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(generated, "utf8");
    const actualBuf = Buffer.from(signature, "utf8");

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error("[Razorpay Webhook] Crypto verification error:", err);
    return false;
  }
}

// In-memory fallback for timestamps across serverless cold starts
let inMemoryLastWebhook: string | null = null;
let inMemoryLastVerifiedPayment: string | null = null;

/**
 * Record last webhook timestamp
 */
export async function recordLastWebhookTimestamp(timestamp = new Date().toISOString()): Promise<void> {
  inMemoryLastWebhook = timestamp;
  try {
    const supabase = createAdminClient();
    await supabase.from("site_settings").upsert({
      key: "last_webhook_received_at",
      value: timestamp,
      description: "Timestamp of last verified Razorpay webhook received",
      updated_at: timestamp,
    });
  } catch {
    // ignore
  }
}

/**
 * Record last verified payment timestamp
 */
export async function recordLastVerifiedPaymentTimestamp(timestamp = new Date().toISOString()): Promise<void> {
  inMemoryLastVerifiedPayment = timestamp;
  try {
    const supabase = createAdminClient();
    await supabase.from("site_settings").upsert({
      key: "last_verified_payment_at",
      value: timestamp,
      description: "Timestamp of last verified real Razorpay payment",
      updated_at: timestamp,
    });
  } catch {
    // ignore
  }
}

/**
 * Fetch full payment gateway status for Admin Settings card
 * Never displays secrets.
 */
export async function getRazorpayGatewayStatus(): Promise<RazorpayGatewayStatus> {
  const isProd = isProductionPaymentEnv();
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || "";

  const mode = getRazorpayKeyMode(keyId);
  const isTestKeyInProduction = isProd && mode === "TEST";
  const isLiveKeyOutsideProduction = !isProd && mode === "LIVE";
  const webhookSecretConfigured = Boolean(webhookSecret && !webhookSecret.includes("placeholder"));
  const maskedKeyId = maskRazorpayKeyId(keyId);
  const isReady = validateRazorpayEnvironment().isValid;

  let lastWebhookReceivedAt: string | null = inMemoryLastWebhook;
  let lastVerifiedPaymentAt: string | null = inMemoryLastVerifiedPayment;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["last_webhook_received_at", "last_verified_payment_at"]);

    if (data) {
      for (const row of data) {
        if (row.key === "last_webhook_received_at" && typeof row.value === "string") {
          lastWebhookReceivedAt = row.value;
        }
        if (row.key === "last_verified_payment_at" && typeof row.value === "string") {
          lastVerifiedPaymentAt = row.value;
        }
      }
    }

    // Fallback: Check most recent paid order if no explicit setting yet
    if (!lastVerifiedPaymentAt) {
      const { data: latestOrder } = await supabase
        .from("orders")
        .select("paid_at")
        .eq("payment_status", "paid")
        .not("paid_at", "is", null)
        .order("paid_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestOrder?.paid_at) {
        lastVerifiedPaymentAt = latestOrder.paid_at;
      }
    }
  } catch {
    // ignore
  }

  return {
    mode,
    isProduction: isProd,
    isTestKeyInProduction,
    isLiveKeyOutsideProduction,
    maskedKeyId,
    webhookSecretConfigured,
    lastWebhookReceivedAt,
    lastVerifiedPaymentAt,
    isGatewayReady: isReady,
  };
}
