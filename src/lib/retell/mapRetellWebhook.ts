import type {
  LeadIntent,
  LeadUrgency,
  TranscriptTurn,
  VoiceEventPayload,
} from "@/lib/db/types";

export interface RetellCustomAnalysis {
  client_name?: string;
  client_phone?: string;
  intent?: "buy" | "rent" | "sell" | "finance" | "other";
  budget_max?: number;
  budget_min?: number;
  location_preference?: string;
  preferred_locations?: string[];
  rooms_min?: number;
  property_type?: string;
  urgency?: "high" | "medium" | "low";
  notes?: string;
  email?: string;
}

export interface RetellCallAnalysis {
  call_summary?: string;
  user_sentiment?: string;
  custom_analysis_data?: RetellCustomAnalysis;
}

/** Flat or nested Retell webhook body (call_analyzed / call_ended variants) */
export interface RetellWebhookPayload {
  event?: string;
  call_id?: string;
  agent_id?: string;
  from_number?: string;
  to_number?: string;
  direction?: string;
  recording_url?: string | null;
  transcript?: unknown;
  start_timestamp?: number;
  end_timestamp?: number;
  call_analysis?: RetellCallAnalysis;
  call?: {
    call_id?: string;
    agent_id?: string;
    from_number?: string;
    to_number?: string;
    direction?: string;
    recording_url?: string | null;
    transcript?: unknown;
    start_timestamp?: number;
    end_timestamp?: number;
    call_analysis?: RetellCallAnalysis;
  };
}

function normalizeIntent(value: unknown): LeadIntent | null {
  if (value === "buy" || value === "rent" || value === "sell") return value;
  if (value === "finance" || value === "other") return value;
  return null;
}

function normalizeUrgency(value: unknown): LeadUrgency | null {
  if (value === "high" || value === "medium" || value === "low") return value;
  return null;
}

function normalizeTranscript(raw: unknown): TranscriptTurn[] {
  if (!raw) return [];

  if (typeof raw === "string") {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const agentMatch = line.match(/^(Agent|AI|Assistant|Sarah)\s*:\s*(.*)$/i);
        if (agentMatch) {
          return { role: "agent" as const, content: agentMatch[2] };
        }
        const userMatch = line.match(/^(User|Caller|Human|Kunde)\s*:\s*(.*)$/i);
        if (userMatch) {
          return { role: "user" as const, content: userMatch[2] };
        }
        return { role: "system" as const, content: line };
      });
  }

  if (Array.isArray(raw)) {
    const turns: TranscriptTurn[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const content = String(row.content ?? row.text ?? "");
      if (!content) continue;
      const roleRaw = String(row.role ?? row.speaker ?? "user").toLowerCase();
      const role: TranscriptTurn["role"] =
        roleRaw.includes("agent") ||
        roleRaw.includes("assistant") ||
        roleRaw === "ai"
          ? "agent"
          : roleRaw.includes("system")
            ? "system"
            : "user";
      const turn: TranscriptTurn = { role, content };
      if (typeof row.timestamp === "string") {
        turn.timestamp = row.timestamp;
      }
      turns.push(turn);
    }
    return turns;
  }

  return [];
}

function durationSeconds(
  start: number | undefined,
  end: number | undefined,
): number | undefined {
  if (typeof start !== "number" || typeof end !== "number") return undefined;
  // Retell timestamps are typically ms; if already seconds, keep sane range
  const delta = end - start;
  if (delta <= 0) return 0;
  if (delta > 10_000) return Math.round(delta / 1000);
  return Math.round(delta);
}

function toIso(ts: number | undefined): string | undefined {
  if (typeof ts !== "number") return undefined;
  const ms = ts > 10_000_000_000 ? ts : ts * 1000;
  return new Date(ms).toISOString();
}

export function isRetellStylePayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as RetellWebhookPayload;
  return Boolean(
    p.call_analysis ||
      p.call?.call_analysis ||
      p.event === "call_analyzed" ||
      typeof p.start_timestamp === "number" ||
      typeof p.call?.start_timestamp === "number",
  );
}

/**
 * Map Retell webhook payload → OpsFlow VoiceEventPayload (store facade contract).
 * `external_call_id` / provider idempotency key = Retell `call_id`.
 */
export function mapRetellWebhookToVoiceEvent(
  payload: RetellWebhookPayload,
): VoiceEventPayload | { ignored: true; reason: string } {
  const event = payload.event ?? "call_analyzed";
  if (event !== "call_analyzed" && event !== "call_ended") {
    return {
      ignored: true,
      reason: `Event '${event}' not handled (expected call_analyzed)`,
    };
  }

  const call = payload.call ?? {};
  const callId = payload.call_id ?? call.call_id;
  if (!callId) {
    throw new Error("Retell payload missing call_id");
  }

  const analysis =
    payload.call_analysis ?? call.call_analysis ?? ({} as RetellCallAnalysis);
  const custom = analysis.custom_analysis_data ?? {};

  const locations =
    custom.preferred_locations ??
    (custom.location_preference ? [custom.location_preference] : []);

  const start = payload.start_timestamp ?? call.start_timestamp;
  const end = payload.end_timestamp ?? call.end_timestamp;

  return {
    event: "call_analyzed",
    call_id: callId,
    agent_id: payload.agent_id ?? call.agent_id,
    from_number: payload.from_number ?? call.from_number,
    to_number: payload.to_number ?? call.to_number,
    direction:
      (payload.direction ?? call.direction) === "outbound"
        ? "outbound"
        : "inbound",
    duration_seconds: durationSeconds(start, end),
    recording_url: payload.recording_url ?? call.recording_url ?? null,
    transcript: normalizeTranscript(payload.transcript ?? call.transcript),
    summary: analysis.call_summary,
    sentiment: analysis.user_sentiment,
    started_at: toIso(start),
    ended_at: toIso(end),
    lead: {
      full_name: custom.client_name ?? null,
      phone: custom.client_phone ?? payload.from_number ?? call.from_number ?? null,
      email: custom.email ?? null,
      intent: normalizeIntent(custom.intent),
      budget_min: custom.budget_min ?? null,
      budget_max: custom.budget_max ?? null,
      preferred_locations: locations,
      property_type: custom.property_type ?? null,
      rooms: custom.rooms_min ?? null,
      urgency: normalizeUrgency(custom.urgency),
      notes: custom.notes ?? analysis.call_summary ?? null,
      status: "new",
    },
  };
}
