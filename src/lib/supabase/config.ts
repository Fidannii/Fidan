export type DataBackend = "demo" | "supabase";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

/**
 * Backend selection:
 * - DATA_BACKEND=demo|supabase forces a mode
 * - otherwise: supabase if credentials exist, else demo
 */
export function resolveDataBackend(): DataBackend {
  const forced = process.env.DATA_BACKEND?.trim().toLowerCase();
  if (forced === "demo") return "demo";
  if (forced === "supabase") {
    if (!isSupabaseConfigured()) {
      throw new Error(
        "DATA_BACKEND=supabase but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing",
      );
    }
    return "supabase";
  }
  return isSupabaseConfigured() ? "supabase" : "demo";
}

export function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL?.trim();
  if (!url) throw new Error("SUPABASE_URL is not set");
  return url;
}

export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return key;
}

/** Default org used by server routes until auth/session org resolution exists */
export function getDefaultOrganizationId(): string | null {
  return process.env.OPSFLOW_DEFAULT_ORG_ID?.trim() || null;
}
