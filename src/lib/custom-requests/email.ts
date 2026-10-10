import { resend } from "@/lib/resend";
import { getCustomRequestStatusMeta } from "./constants";

const SENDER_EMAIL = process.env.EMAIL_FROM || "orders@clawcraft.in";
const STUDIO_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";
const STUDIO_EMAIL = process.env.NEXT_PUBLIC_STUDIO_EMAIL || "studio@clawcraft.in";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://claw-craft-studio.vercel.app";
}

export interface SendSubmissionEmailParams {
  customerName: string;
  customerEmail: string;
  refCode: string;
  publicToken: string;
  conceptSummary: string;
}

export interface SendStatusUpdateEmailParams {
  customerName: string;
  customerEmail: string;
  refCode: string;
  publicToken: string;
  status: string;
  customerMessage?: string | null;
}

export interface EmailResult {
  success: boolean;
  sentAt?: string;
  error?: string;
}

/**
 * Helper to execute Resend call with a single retry on transient failures
 */
async function sendWithRetry(payload: Parameters<typeof resend.emails.send>[0]): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.warn("[Resend Warning] RESEND_API_KEY is missing or using placeholder. Email skipped in mock mode.");
    return { success: false, error: "RESEND_API_KEY not configured on server" };
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await resend.emails.send(payload);
      if (response.error) {
        throw new Error(response.error.message || "Resend API rejected message");
      }
      return { success: true };
    } catch (err: any) {
      const isTransient = attempt === 1 && (err?.message?.includes("fetch") || err?.message?.includes("timeout") || err?.code === "ECONNRESET");
      if (isTransient) {
        console.warn(`[Resend Warning] Transient email error on attempt 1, retrying: ${err?.message}`);
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      console.error(`[Resend Error] Email dispatch failed: ${err?.message}`);
      return { success: false, error: err?.message || "Email dispatch failed" };
    }
  }

  return { success: false, error: "Failed after retry" };
}

/**
 * 1. Initial Request Confirmation Email
 */
export async function sendCustomRequestReceivedEmail(params: SendSubmissionEmailParams): Promise<EmailResult> {
  const baseUrl = getBaseUrl();
  const trackUrl = `${baseUrl}/track/custom?ref=${encodeURIComponent(params.refCode)}&t=${encodeURIComponent(params.publicToken)}`;

  const subject = `We received your custom build request ${params.refCode} | CLAWCRAFT Studio`;

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${subject}</title>
  </head>
  <body style="background-color: #050505; color: #F2F0EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #111214; border: 1px solid #22262E; padding: 32px; border-radius: 4px;">
      
      <!-- Studio Header -->
      <div style="border-bottom: 2px solid #B8FF1F; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #F2F0EA; font-size: 26px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">CLAWCRAFT STUDIO</h1>
        <p style="color: #B8FF1F; font-size: 11px; margin: 6px 0 0; text-transform: uppercase; font-family: monospace; letter-spacing: 1px;">Custom Can Sculpture Atelier</p>
      </div>

      <p style="font-size: 16px; color: #F2F0EA; margin: 0 0 16px;">Hello ${escapeHtml(params.customerName)},</p>

      <p style="font-size: 14px; line-height: 1.6; color: #8E959F; margin: 0 0 20px;">
        Your custom commission proposal has been received and logged in our workbench queue under reference 
        <strong style="color: #B8FF1F; font-family: monospace;">${escapeHtml(params.refCode)}</strong>.
      </p>

      <div style="background-color: #050505; border-left: 3px solid #B8FF1F; border-top: 1px solid #22262E; border-right: 1px solid #22262E; border-bottom: 1px solid #22262E; padding: 16px; margin: 20px 0;">
        <p style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #8E959F; margin: 0 0 6px;">Concept Proposal:</p>
        <p style="font-size: 13px; color: #F2F0EA; line-height: 1.5; margin: 0; font-style: italic;">
          "${escapeHtml(params.conceptSummary)}"
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #8E959F; margin: 0 0 24px;">
        Our artisans are currently analyzing can availability, internal armature requirements, and structural balance. You can check real-time progress anytime via your private tracking link:
      </p>

      <!-- Action Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${trackUrl}" style="background-color: #B8FF1F; color: #050505; font-weight: bold; text-decoration: none; padding: 14px 28px; font-size: 13px; font-family: monospace; letter-spacing: 1px; text-transform: uppercase; border-radius: 2px; display: inline-block;">
          TRACK YOUR REQUEST
        </a>
      </div>

      <!-- Support Info -->
      <div style="background-color: #0A0B0D; border: 1px solid #1A1D23; padding: 16px; border-radius: 2px; margin-top: 30px;">
        <p style="font-size: 12px; color: #8E959F; margin: 0 0 4px;">Direct Studio Inquiries:</p>
        <p style="font-size: 12px; color: #F2F0EA; margin: 0;">WhatsApp: +${escapeHtml(STUDIO_PHONE)} &bull; Email: ${escapeHtml(STUDIO_EMAIL)}</p>
      </div>

      <!-- Studio Disclaimer Footer -->
      <div style="border-top: 1px solid #22262E; margin-top: 32px; padding-top: 16px; text-align: center;">
        <p style="font-size: 11px; color: #555A64; line-height: 1.5; margin: 0;">
          CLAWCRAFT is an independent craft atelier creating handmade sculptures from recycled and empty metal beverage cans. Decorative art piece. Not a toy.
        </p>
      </div>

    </div>
  </body>
</html>
  `;

  const text = `
CLAWCRAFT STUDIO - Custom Can Sculpture Atelier
===============================================

Hello ${params.customerName},

Your custom commission proposal has been received and logged under reference ${params.refCode}.

Concept:
"${params.conceptSummary}"

Track real-time progress anytime via your private link:
${trackUrl}

Direct Studio Inquiries:
WhatsApp: +${STUDIO_PHONE}
Email: ${STUDIO_EMAIL}

CLAWCRAFT is an independent craft atelier creating handmade sculptures from recycled and empty metal beverage cans.
  `.trim();

  const res = await sendWithRetry({
    from: SENDER_EMAIL,
    to: params.customerEmail,
    subject,
    html,
    text,
  });

  return {
    success: res.success,
    sentAt: res.success ? new Date().toISOString() : undefined,
    error: res.error,
  };
}

/**
 * 2. Status Update & Artisan Message Email
 */
export async function sendCustomRequestStatusUpdateEmail(params: SendStatusUpdateEmailParams): Promise<EmailResult> {
  const meta = getCustomRequestStatusMeta(params.status);
  const baseUrl = getBaseUrl();
  const trackUrl = `${baseUrl}/track/custom?ref=${encodeURIComponent(params.refCode)}&t=${encodeURIComponent(params.publicToken)}`;

  const subject = `Update on your custom build request ${params.refCode}: ${meta.label}`;

  const messageBlock = params.customerMessage?.trim()
    ? `
      <div style="background-color: #050505; border-left: 3px solid #B8FF1F; border-top: 1px solid #22262E; border-right: 1px solid #22262E; border-bottom: 1px solid #22262E; padding: 16px; margin: 20px 0;">
        <p style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #B8FF1F; margin: 0 0 6px;">Note from the Workshop:</p>
        <p style="font-size: 14px; color: #F2F0EA; line-height: 1.6; margin: 0; font-style: italic;">
          "${escapeHtml(params.customerMessage.trim())}"
        </p>
      </div>
    `
    : "";

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${subject}</title>
  </head>
  <body style="background-color: #050505; color: #F2F0EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #111214; border: 1px solid #22262E; padding: 32px; border-radius: 4px;">
      
      <!-- Studio Header -->
      <div style="border-bottom: 2px solid #B8FF1F; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #F2F0EA; font-size: 26px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">CLAWCRAFT STUDIO</h1>
        <p style="color: #B8FF1F; font-size: 11px; margin: 6px 0 0; text-transform: uppercase; font-family: monospace; letter-spacing: 1px;">Commission Progress Update</p>
      </div>

      <p style="font-size: 16px; color: #F2F0EA; margin: 0 0 16px;">Hello ${escapeHtml(params.customerName)},</p>

      <p style="font-size: 14px; line-height: 1.6; color: #8E959F; margin: 0 0 16px;">
        There is a new update regarding your custom build request 
        <strong style="color: #B8FF1F; font-family: monospace;">${escapeHtml(params.refCode)}</strong>:
      </p>

      <!-- Status Box -->
      <div style="background-color: #0A0B0D; border: 1px solid #22262E; padding: 18px; border-radius: 4px; margin: 20px 0;">
        <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #8E959F; margin-bottom: 4px;">Current Status</div>
        <div style="font-size: 20px; font-weight: bold; color: #B8FF1F; text-transform: uppercase; letter-spacing: 1px;">${escapeHtml(meta.label)}</div>
        <div style="font-size: 13px; color: #C9CDD2; margin-top: 6px; line-height: 1.5;">${escapeHtml(meta.description)}</div>
      </div>

      ${messageBlock}

      <!-- Action Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${trackUrl}" style="background-color: #B8FF1F; color: #050505; font-weight: bold; text-decoration: none; padding: 14px 28px; font-size: 13px; font-family: monospace; letter-spacing: 1px; text-transform: uppercase; border-radius: 2px; display: inline-block;">
          VIEW FULL TIMELINE
        </a>
      </div>

      <!-- Support Info -->
      <div style="background-color: #0A0B0D; border: 1px solid #1A1D23; padding: 16px; border-radius: 2px; margin-top: 30px;">
        <p style="font-size: 12px; color: #8E959F; margin: 0 0 4px;">Questions about this update?</p>
        <p style="font-size: 12px; color: #F2F0EA; margin: 0;">Reply directly, or chat via WhatsApp: +${escapeHtml(STUDIO_PHONE)}</p>
      </div>

      <!-- Studio Disclaimer Footer -->
      <div style="border-top: 1px solid #22262E; margin-top: 32px; padding-top: 16px; text-align: center;">
        <p style="font-size: 11px; color: #555A64; line-height: 1.5; margin: 0;">
          CLAWCRAFT is an independent craft atelier creating handmade sculptures from recycled and empty metal beverage cans. Decorative art piece. Not a toy.
        </p>
      </div>

    </div>
  </body>
</html>
  `;

  const text = `
CLAWCRAFT STUDIO - Commission Update
====================================

Hello ${params.customerName},

Update for request ${params.refCode}:
Status: ${meta.label}
Details: ${meta.description}
${params.customerMessage?.trim() ? `\nWorkshop Note:\n"${params.customerMessage.trim()}"\n` : ""}
Track real-time progress:
${trackUrl}

Direct Studio Inquiries:
WhatsApp: +${STUDIO_PHONE}
Email: ${STUDIO_EMAIL}

CLAWCRAFT is an independent craft atelier creating handmade sculptures from recycled and empty metal beverage cans.
  `.trim();

  const res = await sendWithRetry({
    from: SENDER_EMAIL,
    to: params.customerEmail,
    subject,
    html,
    text,
  });

  return {
    success: res.success,
    sentAt: res.success ? new Date().toISOString() : undefined,
    error: res.error,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
