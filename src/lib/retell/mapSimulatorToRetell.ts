import type { TranscriptTurn } from "@/lib/db/types";
import type { RetellWebhookPayload } from "@/lib/retell/mapRetellWebhook";

/**
 * Map simulator finish payload → Retell-compatible call_analyzed event.
 * Keeps one ingestion path for browser sims and live Retell webhooks.
 */
export function mapSimulatorFinishToRetellEvent(input: {
  transcript: TranscriptTurn[];
  leadDraft: Record<string, unknown>;
  duration_seconds: number;
  summary?: string;
}): RetellWebhookPayload {
  const draft = input.leadDraft;
  const end = Date.now();
  const start = end - Math.max(input.duration_seconds, 1) * 1000;

  const locations = Array.isArray(draft.preferred_locations)
    ? (draft.preferred_locations as string[])
    : typeof draft.location_preference === "string"
      ? [draft.location_preference]
      : [];

  const summary =
    input.summary ??
    (typeof draft.notes === "string"
      ? `Simulator: ${String(draft.full_name ?? "Lead")} – ${draft.notes}`
      : `Simulator-Lead ${String(draft.full_name ?? "unbekannt")}`);

  return {
    event: "call_analyzed",
    call_id: `sim_${end}`,
    agent_id: "agent_simulator",
    from_number:
      typeof draft.phone === "string" ? draft.phone : "+490000000000",
    to_number: "+49409876543",
    direction: "inbound",
    start_timestamp: start,
    end_timestamp: end,
    recording_url: null,
    transcript: input.transcript,
    call_analysis: {
      call_summary: summary,
      user_sentiment: "Positive",
      custom_analysis_data: {
        client_name:
          typeof draft.full_name === "string" ? draft.full_name : undefined,
        client_phone:
          typeof draft.phone === "string" ? draft.phone : undefined,
        email: typeof draft.email === "string" ? draft.email : undefined,
        intent:
          draft.intent === "buy" ||
          draft.intent === "rent" ||
          draft.intent === "sell" ||
          draft.intent === "finance" ||
          draft.intent === "other"
            ? draft.intent
            : undefined,
        budget_min:
          typeof draft.budget_min === "number" ? draft.budget_min : undefined,
        budget_max:
          typeof draft.budget_max === "number" ? draft.budget_max : undefined,
        location_preference: locations[0],
        preferred_locations: locations,
        rooms_min: typeof draft.rooms === "number" ? draft.rooms : undefined,
        property_type:
          typeof draft.property_type === "string"
            ? draft.property_type
            : undefined,
        urgency:
          draft.urgency === "high" ||
          draft.urgency === "medium" ||
          draft.urgency === "low"
            ? draft.urgency
            : undefined,
        notes: typeof draft.notes === "string" ? draft.notes : summary,
      },
    },
  };
}
