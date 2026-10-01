import { getCall, getLead, ingestVoiceEvent } from "@/lib/db/store";
import { mapRetellWebhookToVoiceEvent } from "@/lib/retell/mapRetellWebhook";
import type { RetellWebhookPayload } from "@/lib/retell/mapRetellWebhook";
import type { Call, Lead } from "@/lib/db/types";

/**
 * Shared ingestion entry for any Retell-compatible payload
 * (live webhook or simulator-mapped event).
 */
export async function ingestRetellCompatibleEvent(
  payload: RetellWebhookPayload,
  options?: { direction?: Call["direction"] },
): Promise<{ call: Call; lead: Lead; leadId: string }> {
  const mapped = mapRetellWebhookToVoiceEvent(payload);
  if ("ignored" in mapped) {
    throw new Error(mapped.reason);
  }
  if (options?.direction) {
    mapped.direction = options.direction;
  }

  const result = await ingestVoiceEvent(mapped);
  const call = await getCall(result.call_id);
  const lead = result.lead_id ? await getLead(result.lead_id) : null;

  if (!call || !lead) {
    throw new Error("Ingestion did not produce call + lead");
  }

  return { call, lead, leadId: lead.id };
}
