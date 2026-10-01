import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/config";

let serviceClient: SupabaseClient | null = null;

/**
 * Server-side Supabase client with service role.
 * Used for webhooks and server data access until user-scoped Auth is wired.
 * Bypasses RLS — always scope queries by organization_id in application code.
 */
export function getServiceSupabase(): SupabaseClient {
  if (serviceClient) return serviceClient;
  serviceClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return serviceClient;
}
