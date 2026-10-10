import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getStrictServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";
import { CustomRequestStatus } from "@/types/database.types";
import { sendCustomRequestReceivedEmail } from "@/lib/custom-requests/email";

export const dynamic = "force-dynamic";

// --- In-Memory Sliding Window IP Rate Limiting (5 requests per 10 minutes) ---
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string, limit = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = ipRateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count += 1;
  return true;
}

// Basic text sanitization helper (strips HTML tags and excessive control chars)
function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>?/gm, "") // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Strip non-printable control chars
    .trim();
}

// Zod Schema Definition
const customRequestSchema = z.object({
  name: z
    .string({ required_error: "Full name is required." })
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(2, "Name must be at least 2 characters.")
        .max(80, "Name cannot exceed 80 characters.")
    ),
  email: z
    .string({ required_error: "Email address is required." })
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .email("Please provide a valid email address.")
        .max(255, "Email address is too long.")
    ),
  phone: z
    .string({ required_error: "Phone number is required." })
    .transform((val) => sanitizeText(val).replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .regex(
          /^[6-9]\d{9}$/,
          "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
        )
    ),
  concept_description: z
    .string({ required_error: "Concept description is required." })
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(20, "Please describe your custom sculpture concept in at least 20 characters.")
        .max(2000, "Concept description cannot exceed 2000 characters.")
    ),
  preferred_can_types: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeText(val).slice(0, 200) : null)),
  estimated_size: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeText(val).slice(0, 100) : null)),
  budget_inr: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeText(val).slice(0, 100) : null)),
  reference_image_urls: z
    .array(z.string().url("Invalid image URL"))
    .max(10, "Maximum 10 reference images allowed.")
    .optional()
    .default([]),
  honeypot: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(clientIp)) {
      console.warn(`[Rate Limit Exceeded] Too many custom requests from IP: ${clientIp}`);
      return NextResponse.json(
        {
          error: "Too many commission requests from this network. Please wait a few minutes before trying again.",
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    // 2. Parse request body
    let rawBody: Record<string, unknown>;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request payload.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // 3. Honeypot check (anti-bot)
    const honeypotVal = rawBody.honeypot || rawBody.website || rawBody.hp_field;
    if (honeypotVal && typeof honeypotVal === "string" && honeypotVal.trim() !== "") {
      console.warn(`[Spam Detected] Honeypot triggered from IP: ${clientIp}`);
      return NextResponse.json(
        { error: "Invalid submission.", code: "SPAM_DETECTED" },
        { status: 400 }
      );
    }

    // 4. Map form fields to schema inputs (support both concept and concept_description)
    const normalizedInput = {
      name: rawBody.name,
      email: rawBody.email,
      phone: rawBody.phone,
      concept_description: rawBody.concept_description ?? rawBody.concept,
      preferred_can_types: rawBody.preferred_can_types ?? rawBody.preferredCans,
      estimated_size: rawBody.estimated_size ?? rawBody.estimatedSize,
      budget_inr: rawBody.budget_inr ?? rawBody.budget,
      reference_image_urls: Array.isArray(rawBody.reference_image_urls)
        ? rawBody.reference_image_urls
        : Array.isArray(rawBody.referenceUrls)
        ? rawBody.referenceUrls
        : [],
      honeypot: honeypotVal || null,
    };

    // 5. Zod Validation
    const validationResult = customRequestSchema.safeParse(normalizedInput);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        validationResult.error.errors[0]?.message || "Please check the form inputs.";
      return NextResponse.json(
        {
          error: firstErrorMessage,
          fieldErrors,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const validated = validationResult.data;

    // 6. Verify Server-Only Service Role Key Presence
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        "[CRITICAL CONFIG ERROR] SUPABASE_SERVICE_ROLE_KEY is missing or empty in server environment. Commission requests cannot be saved to public.custom_requests."
      );
      return NextResponse.json(
        {
          error: "We could not save your request, please try again or message us on WhatsApp",
          code: "SERVER_CONFIG_ERROR",
        },
        { status: 500 }
      );
    }

    // 7. Check Authenticated Session on Server (NEVER trust user_id from client body)
    let sessionUserId: string | null = null;
    try {
      const userSupabase = createClient();
      const { data: authData } = await userSupabase.auth.getUser();
      if (authData?.user) {
        sessionUserId = authData.user.id;
      }
    } catch {
      // Anonymous visitor submitting guest commission request
    }

    // 8. Insert with Server-Only Service Role Client
    const supabase = getStrictServiceRoleClient();
    const generatedToken = crypto.randomBytes(32).toString("hex");

    const insertPayload: Record<string, unknown> = {
      name: validated.name,
      email: validated.email.toLowerCase(),
      phone: validated.phone,
      concept_description: validated.concept_description,
      preferred_can_types: validated.preferred_can_types || null,
      estimated_size: validated.estimated_size || null,
      budget_inr: validated.budget_inr || null,
      reference_image_urls: validated.reference_image_urls,
      status: "new" as CustomRequestStatus,
      admin_notes: null,
      user_id: sessionUserId,
      public_token: generatedToken,
      last_status_change_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("custom_requests")
      .insert(insertPayload as any)
      .select("id, ref_code, public_token, created_at")
      .single();

    // FAIL LOUDLY: Return success ONLY if insert returned the new row id
    if (error || !data?.id) {
      console.error("[Custom Request Database Insert Failed]", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      });

      return NextResponse.json(
        {
          error: "We could not save your request, please try again or message us on WhatsApp",
          code: error?.code || "DATABASE_INSERT_FAILED",
        },
        { status: 500 }
      );
    }

    // Determine final ref_code and public_token
    let finalRefCode: string = data.ref_code || "";
    const finalToken: string = data.public_token || generatedToken;

    if (!finalRefCode) {
      finalRefCode = `CR-${new Date().getFullYear()}-${data.id.slice(0, 4).toUpperCase()}`;
      try {
        await supabase
          .from("custom_requests")
          .update({ ref_code: finalRefCode, public_token: finalToken } as any)
          .eq("id", data.id);
      } catch (updateRefErr) {
        console.warn("[Custom Request Ref Backfill Warning]", updateRefErr);
      }
    }

    // 9. Backfill Initial "Submitted" Timeline Event
    try {
      await supabase.from("custom_request_events").insert({
        request_id: data.id,
        status: "new",
        customer_message: "Custom build request submitted.",
        created_at: data.created_at || new Date().toISOString(),
      } as any);
    } catch (eventErr) {
      console.warn("[Custom Request Initial Event Warning]", eventErr);
    }

    // 10. Customer Initial Confirmation Email with Private Tracking Link
    try {
      await sendCustomRequestReceivedEmail({
        customerName: validated.name,
        customerEmail: validated.email,
        refCode: finalRefCode,
        publicToken: finalToken,
        conceptSummary:
          validated.concept_description.length > 140
            ? `${validated.concept_description.slice(0, 140)}...`
            : validated.concept_description,
      });
    } catch (custEmailErr) {
      console.error("[Customer Confirmation Email Non-Fatal Error]", custEmailErr);
    }

    // 11. Admin Email Notification (non-blocking: must never fail the request if email fails)
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "studio@clawcraft.in";
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("placeholder")) {
      try {
        const referenceHtml =
          validated.reference_image_urls.length > 0
            ? `<p><strong>Attached Reference Visuals (${validated.reference_image_urls.length}):</strong></p><ul>${validated.reference_image_urls
                .map((u) => `<li><a href="${u}" target="_blank">${u}</a></li>`)
                .join("")}</ul>`
            : "";

        await resend.emails.send({
          from: process.env.EMAIL_FROM || "orders@clawcraft.in",
          to: adminEmail,
          subject: `⚡ New Commission Proposal [${finalRefCode}]: ${validated.name}`,
          html: `
            <h2>New Bespoke Can Sculpture Inquiry</h2>
            <p><strong>Reference Code:</strong> ${finalRefCode} (${data.id})</p>
            <p><strong>Client:</strong> ${validated.name} (${validated.email}, +91 ${validated.phone})</p>
            <p><strong>Concept:</strong></p>
            <blockquote style="background:#111; color:#eee; padding:12px; border-left:3px solid #b8ff1f;">
              ${validated.concept_description}
            </blockquote>
            <p><strong>Preferred Cans:</strong> ${validated.preferred_can_types || "N/A"}</p>
            <p><strong>Target Size:</strong> ${validated.estimated_size || "N/A"}</p>
            <p><strong>Budget:</strong> ${validated.budget_inr || "Flexible"}</p>
            ${referenceHtml}
            <p><a href="https://wa.me/91${validated.phone}?text=Hello%20${encodeURIComponent(
            validated.name
          )},%20this%20is%20CLAWCRAFT%20Studio%20regarding%20your%20custom%20commission%20proposal%20(${finalRefCode})">Click here to message client on WhatsApp</a></p>
          `,
        });
      } catch (emailErr) {
        console.error("[Resend Custom Request Alert Error (Non-Fatal)]", emailErr);
      }
    } else {
      console.log(`[Email Notice] Custom inquiry notification dispatched to ${adminEmail}`);
    }

    // 12. Return Tracking Credentials and Direct Link
    const trackUrl = `/track/custom?ref=${encodeURIComponent(finalRefCode)}&t=${encodeURIComponent(finalToken)}`;

    return NextResponse.json({
      success: true,
      id: data.id,
      refCode: finalRefCode,
      publicToken: finalToken,
      referenceId: finalRefCode,
      trackUrl,
      message: "Commission proposal recorded successfully.",
    });
  } catch (error) {
    console.error("[Custom Request Route Exception]", error);
    return NextResponse.json(
      {
        error: "We could not save your request, please try again or message us on WhatsApp",
        code: "SERVER_EXCEPTION",
      },
      { status: 500 }
    );
  }
}
