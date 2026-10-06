import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

/**
 * Normalizes Supabase URL by removing accidental trailing slashes,
 * /rest/v1 suffixes, quotes, or dashboard URLs.
 */
export function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  let url = rawUrl.trim().replace(/^["']|["']$/g, "").trim();

  // If user pasted the dashboard URL: https://supabase.com/dashboard/project/<ref>
  const dashboardMatch = url.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // Remove /rest/v1 or /rest or /auth/v1 if accidentally included
  url = url.replace(/\/(rest|auth)\/v[0-9]+$/i, "");
  url = url.replace(/\/rest$/i, "");
  return url.replace(/\/+$/, "");
}

/**
 * Normalizes Supabase key by stripping whitespace and wrapping quotes.
 */
export function sanitizeSupabaseKey(rawKey?: string): string {
  if (!rawKey) return "";
  return rawKey.trim().replace(/^["']|["']$/g, "").trim();
}

export function createAdminClient() {
  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey =
    sanitizeSupabaseKey(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
