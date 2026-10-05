import crypto from "crypto";

const VERIFY_SECRET =
  process.env.ORDER_VERIFY_SECRET || "clawcraft_secure_order_verification_secret_key_2026";

/**
 * Constant-time comparison between two strings to prevent timing attacks.
 */
export function safeCompareTokens(
  a: string | undefined | null,
  b: string | undefined | null
): boolean {
  if (!a || !b) return false;

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    // Constant time dummy check to prevent timing analysis on length
    const dummy = Buffer.alloc(bufA.length);
    crypto.timingSafeEqual(bufA, dummy);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generate HMAC-SHA256 signature for public verification QR code & short URL
 */
export function generateOrderVerifySignature(
  orderNumber: string,
  totalPaise: number
): string {
  const payload = `${orderNumber.trim().toUpperCase()}:${totalPaise}`;
  return crypto
    .createHmac("sha256", VERIFY_SECRET)
    .update(payload)
    .digest("hex")
    .substring(0, 32); // 32-character compact hex signature
}

/**
 * Verify HMAC signature with constant-time comparison
 */
export function verifyOrderVerifySignature(
  orderNumber: string,
  totalPaise: number,
  providedSignature: string | undefined | null
): boolean {
  if (!providedSignature) return false;
  const expected = generateOrderVerifySignature(orderNumber, totalPaise);
  return safeCompareTokens(expected, providedSignature);
}

/**
 * Generates an unguessable 64-char hex random token
 */
export function generatePublicToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
