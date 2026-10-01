import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { getAdminCustomRequests } from "@/lib/admin/admin-data";
import { CustomRequestStatus } from "@/types/database.types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      concept_description,
      preferred_can_types,
      estimated_size,
      budget_inr,
      reference_image_urls,
    } = body;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Please provide your full name." },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone || "").replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    if (
      !concept_description ||
      typeof concept_description !== "string" ||
      concept_description.trim().length < 10
    ) {
      return NextResponse.json(
        { error: "Please describe your custom sculpture concept (at least 10 characters)." },
        { status: 400 }
      );
    }

    const payload = {
      id: `req-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: cleanPhone,
      concept_description: concept_description.trim(),
      preferred_can_types: preferred_can_types ? String(preferred_can_types).trim() : null,
      estimated_size: estimated_size ? String(estimated_size).trim() : null,
      budget_inr: budget_inr ? String(budget_inr).trim() : null,
      reference_image_urls: Array.isArray(reference_image_urls) ? reference_image_urls : [],
      status: "new" as CustomRequestStatus,
      created_at: new Date().toISOString(),
    };

    // 2. Try inserting into Supabase
    let insertedInDb = false;
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.from("custom_requests").insert(payload as any);
      if (!error) {
        insertedInDb = true;
      }
    } catch {
      // In mock/offline mode
    }

    // Fallback store update if Supabase was offline
    if (!insertedInDb) {
      const requests = await getAdminCustomRequests();
      requests.unshift({ ...payload, admin_notes: null });
    }

    // 3. Send Admin Alert Email via Resend
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "studio@clawcraft.in";
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("placeholder")) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "orders@clawcraft.in",
          to: adminEmail,
          subject: `⚡ New Custom Commission Request: ${payload.name}`,
          html: `
            <h2>New Bespoke Can Sculpture Inquiry</h2>
            <p><strong>Client:</strong> ${payload.name} (${payload.email}, +91 ${payload.phone})</p>
            <p><strong>Concept:</strong></p>
            <blockquote style="background:#111; color:#eee; padding:12px; border-left:3px solid #b8ff1f;">
              ${payload.concept_description}
            </blockquote>
            <p><strong>Preferred Cans:</strong> ${payload.preferred_can_types || "N/A"}</p>
            <p><strong>Target Size:</strong> ${payload.estimated_size || "N/A"}</p>
            <p><strong>Budget:</strong> ${payload.budget_inr || "Flexible"}</p>
            <p><a href="https://wa.me/91${payload.phone}">Click here to message client on WhatsApp</a></p>
          `,
        });
      } catch (emailErr) {
        console.error("[Resend Custom Request Alert Error]", emailErr);
      }
    } else {
      console.log(`[Email Mock] Custom inquiry notification dispatched to ${adminEmail}`);
    }

    return NextResponse.json({
      success: true,
      id: payload.id,
      message: "Commission request submitted to CLAWCRAFT Studio.",
    });
  } catch (error) {
    console.error("[Custom Request API Error]", error);
    return NextResponse.json(
      { error: "Failed to submit commission request. Please try again." },
      { status: 500 }
    );
  }
}
