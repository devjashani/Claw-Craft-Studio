import Razorpay from "razorpay";
import crypto from "crypto";

export function getRazorpayClient(): Razorpay {
  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "placeholderSecret";

  return new Razorpay({
    key_id,
    key_secret,
  });
}

/**
 * Verify Razorpay payment signature returned by Checkout modal
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
  const secret = process.env.RAZORPAY_KEY_SECRET || "placeholderSecret";
  const text = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(text)
    .digest("hex");

  return generatedSignature === signature;
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return true; // If secret not set in test environment, allow

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}
