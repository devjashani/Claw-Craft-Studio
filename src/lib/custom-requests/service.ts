import { getStrictServiceRoleClient } from "@/lib/supabase/admin";
import { safeCompareTokens } from "@/lib/orders/order-crypto";
import { CustomRequestStatus } from "@/types/database.types";
import {
  sendCustomRequestStatusUpdateEmail,
  sendCustomRequestReceivedEmail,
} from "./email";

export interface CustomerTimelineEvent {
  id: string;
  status: string;
  customer_message: string | null;
  created_at: string;
}

export interface CustomerCustomRequestDetail {
  id: string;
  ref_code: string;
  public_token?: string | null;
  status: string;
  concept_description: string;
  preferred_can_types: string | null;
  estimated_size: string | null;
  budget_inr: string | null;
  reference_image_urls: string[];
  created_at: string;
  last_status_change_at: string | null;
  events: CustomerTimelineEvent[];
}

export interface AdminCustomRequestEvent {
  id: string;
  request_id: string;
  status: string;
  customer_message: string | null;
  internal_note: string | null;
  created_by: string | null;
  created_at: string;
  email_sent_at: string | null;
  email_error: string | null;
}

/**
 * 1. Public / Private Token Lookup (Constant-Time Verification)
 * Strictly sanitizes output: NEVER leaks phone, email, address, or internal notes.
 */
export async function getCustomRequestByToken(
  refCode: string,
  providedToken: string
): Promise<{ success: boolean; data?: CustomerCustomRequestDetail; error?: string }> {
  const cleanRef = refCode.trim().toUpperCase();
  const cleanToken = providedToken.trim();

  if (!cleanRef || !cleanToken) {
    return { success: false, error: "Reference code and security token are required." };
  }

  const supabase = getStrictServiceRoleClient();
  const { data: request, error } = await supabase
    .from("custom_requests")
    .select(
      "id, ref_code, public_token, status, concept_description, preferred_can_types, estimated_size, budget_inr, reference_image_urls, created_at, last_status_change_at"
    )
    .ilike("ref_code", cleanRef)
    .maybeSingle();

  if (error || !request) {
    return { success: false, error: "No custom build request found." };
  }

  // Constant-time token comparison
  const isMatch = request.public_token && safeCompareTokens(request.public_token, cleanToken);
  if (!isMatch) {
    return { success: false, error: "Invalid tracking credentials." };
  }

  // Fetch timeline events (customer safe only)
  const { data: events } = await supabase
    .from("custom_request_events")
    .select("id, status, customer_message, created_at")
    .eq("request_id", request.id)
    .order("created_at", { ascending: true });

  return {
    success: true,
    data: {
      id: request.id,
      ref_code: request.ref_code || cleanRef,
      public_token: request.public_token,
      status: request.status,
      concept_description: request.concept_description,
      preferred_can_types: request.preferred_can_types,
      estimated_size: request.estimated_size,
      budget_inr: request.budget_inr,
      reference_image_urls: request.reference_image_urls || [],
      created_at: request.created_at,
      last_status_change_at: request.last_status_change_at,
      events: events || [],
    },
  };
}

/**
 * 2. Public Email + Reference Code Lookup (For customers without direct token in URL)
 */
export async function getCustomRequestByEmail(
  refCode: string,
  email: string
): Promise<{ success: boolean; data?: CustomerCustomRequestDetail; publicToken?: string; error?: string }> {
  const cleanRef = refCode.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanRef || !cleanEmail) {
    return { success: false, error: "Reference code and email are required." };
  }

  const supabase = getStrictServiceRoleClient();
  const { data: request, error } = await supabase
    .from("custom_requests")
    .select(
      "id, ref_code, public_token, email, status, concept_description, preferred_can_types, estimated_size, budget_inr, reference_image_urls, created_at, last_status_change_at"
    )
    .ilike("ref_code", cleanRef)
    .maybeSingle();

  if (error || !request) {
    return { success: false, error: "No request found matching provided details." };
  }

  // Verify email matches
  if (request.email.toLowerCase() !== cleanEmail) {
    return { success: false, error: "No request found matching provided details." };
  }

  // Fetch timeline events (customer safe only)
  const { data: events } = await supabase
    .from("custom_request_events")
    .select("id, status, customer_message, created_at")
    .eq("request_id", request.id)
    .order("created_at", { ascending: true });

  return {
    success: true,
    publicToken: request.public_token || undefined,
    data: {
      id: request.id,
      ref_code: request.ref_code || cleanRef,
      public_token: request.public_token || undefined,
      status: request.status,
      concept_description: request.concept_description,
      preferred_can_types: request.preferred_can_types,
      estimated_size: request.estimated_size,
      budget_inr: request.budget_inr,
      reference_image_urls: request.reference_image_urls || [],
      created_at: request.created_at,
      last_status_change_at: request.last_status_change_at,
      events: events || [],
    },
  };
}

/**
 * 3. Fetch all requests for an authenticated customer
 * Enforces email verification requirement. Auto-claims matching guest requests.
 */
export async function getUserCustomRequests(
  userId: string,
  userEmail: string,
  isEmailVerified: boolean
): Promise<{ verified: boolean; requests: CustomerCustomRequestDetail[] }> {
  if (!isEmailVerified) {
    return { verified: false, requests: [] };
  }

  const supabase = getStrictServiceRoleClient();
  const cleanEmail = userEmail.toLowerCase();

  // Server-side claim: link any unlinked historical guest submissions with this verified email
  try {
    await supabase
      .from("custom_requests")
      .update({ user_id: userId })
      .is("user_id", null)
      .ilike("email", cleanEmail);
  } catch (claimErr) {
    console.warn("[Custom Requests Auto-Claim Warning]", claimErr);
  }

  // Query either explicitly owned OR matching verified email
  const { data: rows, error } = await supabase
    .from("custom_requests")
    .select(
      "id, ref_code, public_token, status, concept_description, preferred_can_types, estimated_size, budget_inr, reference_image_urls, created_at, last_status_change_at"
    )
    .or(`user_id.eq.${userId},email.ilike.${cleanEmail}`)
    .order("created_at", { ascending: false });

  if (error || !rows) {
    console.error("[getUserCustomRequests Error]", error);
    return { verified: true, requests: [] };
  }

  return {
    verified: true,
    requests: rows.map((r) => ({
      id: r.id,
      ref_code: r.ref_code || `CR-${r.id.slice(0, 8).toUpperCase()}`,
      public_token: r.public_token || undefined,
      status: r.status,
      concept_description: r.concept_description,
      preferred_can_types: r.preferred_can_types,
      estimated_size: r.estimated_size,
      budget_inr: r.budget_inr,
      reference_image_urls: r.reference_image_urls || [],
      created_at: r.created_at,
      last_status_change_at: r.last_status_change_at,
      events: [],
    })),
  };
}

/**
 * 4. Fetch detail view for an authenticated customer
 */
export async function getUserCustomRequestDetail(
  refCode: string,
  userId: string,
  userEmail: string,
  isEmailVerified: boolean
): Promise<{ success: boolean; data?: CustomerCustomRequestDetail; error?: string }> {
  if (!isEmailVerified) {
    return { success: false, error: "Please verify your email to view this request." };
  }

  const cleanRef = refCode.trim().toUpperCase();
  const cleanEmail = userEmail.toLowerCase();
  const supabase = getStrictServiceRoleClient();

  const { data: request, error } = await supabase
    .from("custom_requests")
    .select(
      "id, ref_code, public_token, user_id, email, status, concept_description, preferred_can_types, estimated_size, budget_inr, reference_image_urls, created_at, last_status_change_at"
    )
    .ilike("ref_code", cleanRef)
    .maybeSingle();

  if (error || !request) {
    return { success: false, error: "Custom request not found." };
  }

  // Authorization check: user must own the row or have matching verified email
  const isOwner = request.user_id === userId || request.email.toLowerCase() === cleanEmail;
  if (!isOwner) {
    return { success: false, error: "Access forbidden." };
  }

  // Fetch timeline events
  const { data: events } = await supabase
    .from("custom_request_events")
    .select("id, status, customer_message, created_at")
    .eq("request_id", request.id)
    .order("created_at", { ascending: true });

  return {
    success: true,
    data: {
      id: request.id,
      ref_code: request.ref_code || cleanRef,
      public_token: request.public_token || undefined,
      status: request.status,
      concept_description: request.concept_description,
      preferred_can_types: request.preferred_can_types,
      estimated_size: request.estimated_size,
      budget_inr: request.budget_inr,
      reference_image_urls: request.reference_image_urls || [],
      created_at: request.created_at,
      last_status_change_at: request.last_status_change_at,
      events: events || [],
    },
  };
}

/**
 * 5. Admin Timeline & Status Update
 */
export interface AddAdminEventParams {
  requestId: string;
  status?: CustomRequestStatus;
  customerMessage?: string | null;
  internalNote?: string | null;
  adminId?: string | null;
  sendEmail?: boolean;
}

export async function addCustomRequestAdminEvent(
  params: AddAdminEventParams
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const supabase = getStrictServiceRoleClient();

  // 1. Fetch current request state
  const { data: request, error: reqErr } = await supabase
    .from("custom_requests")
    .select("id, ref_code, public_token, name, email, status, admin_notes")
    .eq("id", params.requestId)
    .single();

  if (reqErr || !request) {
    return { success: false, error: "Custom request not found." };
  }

  const effectiveStatus = (params.status || request.status) as CustomRequestStatus;
  const nowIso = new Date().toISOString();

  // 2. Insert event
  const { data: newEvent, error: eventErr } = await supabase
    .from("custom_request_events")
    .insert({
      request_id: request.id,
      status: effectiveStatus,
      customer_message: params.customerMessage?.trim() || null,
      internal_note: params.internalNote?.trim() || null,
      created_by: params.adminId || null,
      created_at: nowIso,
    })
    .select("id")
    .single();

  if (eventErr || !newEvent?.id) {
    console.error("[addCustomRequestAdminEvent] Event insert failed:", eventErr);
    return { success: false, error: "Failed to log event record." };
  }

  // 3. Update request status & last_status_change_at
  const updatePayload: Record<string, unknown> = {
    last_status_change_at: nowIso,
  };
  if (params.status) {
    updatePayload.status = params.status;
  }
  if (params.internalNote) {
    // Optionally preserve or append to admin_notes column
    updatePayload.admin_notes = params.internalNote.trim();
  }

  await supabase.from("custom_requests").update(updatePayload as any).eq("id", request.id);

  // 4. Trigger Customer Email Notification if requested
  if (params.sendEmail !== false) {
    try {
      const emailResult = await sendCustomRequestStatusUpdateEmail({
        customerName: request.name,
        customerEmail: request.email,
        refCode: request.ref_code || `CR-${request.id.slice(0, 8).toUpperCase()}`,
        publicToken: request.public_token || "",
        status: effectiveStatus,
        customerMessage: params.customerMessage,
      });

      // Update event with email dispatch results
      await supabase
        .from("custom_request_events")
        .update({
          email_sent_at: emailResult.sentAt || null,
          email_error: emailResult.error || null,
        } as any)
        .eq("id", newEvent.id);
    } catch (emailErr: any) {
      console.error("[addCustomRequestAdminEvent] Email trigger non-fatal exception:", emailErr);
      await supabase
        .from("custom_request_events")
        .update({ email_error: emailErr?.message || "Email trigger error" } as any)
        .eq("id", newEvent.id);
    }
  }

  return { success: true, eventId: newEvent.id };
}

/**
 * 6. Admin Resend Event Email
 */
export async function resendCustomRequestEventEmail(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getStrictServiceRoleClient();

  const { data: event, error: eventErr } = await supabase
    .from("custom_request_events")
    .select("id, request_id, status, customer_message")
    .eq("id", eventId)
    .single();

  if (eventErr || !event) {
    return { success: false, error: "Event record not found." };
  }

  const { data: request, error: reqErr } = await supabase
    .from("custom_requests")
    .select("id, ref_code, public_token, name, email")
    .eq("id", event.request_id)
    .single();

  if (reqErr || !request) {
    return { success: false, error: "Associated custom request not found." };
  }

  const emailResult = await sendCustomRequestStatusUpdateEmail({
    customerName: request.name,
    customerEmail: request.email,
    refCode: request.ref_code || `CR-${request.id.slice(0, 8).toUpperCase()}`,
    publicToken: request.public_token || "",
    status: event.status,
    customerMessage: event.customer_message,
  });

  await supabase
    .from("custom_request_events")
    .update({
      email_sent_at: emailResult.sentAt || null,
      email_error: emailResult.error || null,
    } as any)
    .eq("id", event.id);

  if (!emailResult.success) {
    return { success: false, error: emailResult.error || "Failed to resend email." };
  }

  return { success: true };
}
