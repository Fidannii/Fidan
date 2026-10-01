import { resolveDataBackend } from "@/lib/supabase/config";
import { getServiceSupabase } from "@/lib/supabase/server";
import { cleanupDemoRecordings } from "@/lib/db/demo-store";

export interface RetentionCleanupResult {
  backend: "demo" | "supabase";
  retention_days: number;
  cleaned_count: number;
  cutoff: string;
}

/**
 * Null recording_url on calls older than retention_days.
 * Prefers RPC `cleanup_expired_recordings()` (003 migration).
 */
export async function cleanupExpiredRecordings(
  retentionDays = 30,
): Promise<RetentionCleanupResult> {
  if (retentionDays < 1) {
    throw new Error("retentionDays must be >= 1");
  }

  const backend = resolveDataBackend();
  const cutoffDate = new Date(
    Date.now() - retentionDays * 24 * 60 * 60 * 1000,
  );
  const cutoff = cutoffDate.toISOString();

  if (backend === "demo") {
    const cleaned_count = await cleanupDemoRecordings(cutoff);
    return {
      backend,
      retention_days: retentionDays,
      cleaned_count,
      cutoff,
    };
  }

  const supabase = getServiceSupabase();

  // Canonical RPC from 003_audio_retention_cleanup.sql (returns integer)
  if (retentionDays === 30) {
    const rpc = await supabase.rpc("cleanup_expired_recordings");
    if (!rpc.error) {
      return {
        backend,
        retention_days: retentionDays,
        cleaned_count: Number(rpc.data ?? 0),
        cutoff,
      };
    }
    console.warn(
      "cleanup_expired_recordings RPC unavailable:",
      rpc.error.message,
    );
  }

  // Parameterized compat RPC
  const parameterized = await supabase.rpc("cleanup_expired_call_recordings", {
    retention_days: retentionDays,
  });

  if (!parameterized.error && Array.isArray(parameterized.data) && parameterized.data[0]) {
    const row = parameterized.data[0] as {
      cleaned_count?: number;
      cutoff?: string;
    };
    return {
      backend,
      retention_days: retentionDays,
      cleaned_count: Number(row.cleaned_count ?? 0),
      cutoff: row.cutoff ? String(row.cutoff) : cutoff,
    };
  }

  // Direct update fallback
  const { data: expired, error: selectError } = await supabase
    .from("calls")
    .select("id")
    .not("recording_url", "is", null)
    .lt("created_at", cutoff);

  if (selectError) throw selectError;

  const ids = (expired ?? []).map((r) => r.id as string);
  if (ids.length === 0) {
    return {
      backend,
      retention_days: retentionDays,
      cleaned_count: 0,
      cutoff,
    };
  }

  const { error: updateError } = await supabase
    .from("calls")
    .update({ recording_url: null, updated_at: new Date().toISOString() })
    .in("id", ids);

  if (updateError) {
    // older schemas without updated_at
    const retry = await supabase
      .from("calls")
      .update({ recording_url: null })
      .in("id", ids);
    if (retry.error) throw retry.error;
  }

  return {
    backend,
    retention_days: retentionDays,
    cleaned_count: ids.length,
    cutoff,
  };
}
