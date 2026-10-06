import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";
import { sanitizeSupabaseUrl, sanitizeSupabaseKey } from "./admin";

export function createClient() {
  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
