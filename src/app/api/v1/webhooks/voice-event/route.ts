import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ingestVoiceEvent } from "@/lib/db/store";
import {
  getRetellSigningKey,
  shouldEnforceRetellSignature,
  verifyRetellSignature,
} from "@/lib/security/verifyRetellSignature";
import {
  isRetellStylePayload,
  mapRetellWebhookToVoiceEvent,
} from "@/lib/retell/mapRetellWebhook";
import type { VoiceEventPayload } from "@/lib/db/types";

const transcriptSchema = z.object({
  role: z.enum(["agent", "user", "system"]),
  content: z.string(),
  timestamp: z.string().optional(),
});

const leadSchema = z
  .object({
    full_name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    intent: z
      .enum(["buy", "rent", "sell", "finance", "other"])
      .nullable()
      .optional(),
    budget_min: z.number().nullable().optional(),
    budget_max: z.number().nullable().optional(),
    preferred_locations: z.array(z.string()).optional(),
    property_type: z.string().nullable().optional(),
    rooms: z.number().nullable().optional(),
    move_in_date: z.string().nullable().optional(),
    urgency: z.enum(["low", "medium", "high"]).nullable().optional(),
    notes: z.string().nullable().optional(),
    status: z
      .enum([
        "new",
        "qualified",
        "contacted",
        "appointment",
        "won",
        "lost",
        "spam",
      ])
      .optional(),
    estimated_pipeline_value: z.number().nullable().optional(),
  })
  .optional();

/** Internal/demo contract (simulator + curl helpers) */
const internalBodySchema = z.object({
  event: z.enum(["call_started", "call_ended", "call_analyzed"]),
  call_id: z.string().min(1),
  agent_id: z.string().optional(),
  from_number: z.string().optional(),
  to_number: z.string().optional(),
  direction: z.enum(["inbound", "outbound", "simulator"]).optional(),
  duration_seconds: z.number().optional(),
  recording_url: z.string().nullable().optional(),
  transcript: z.array(transcriptSchema).optional(),
  summary: z.string().optional(),
  sentiment: z.string().optional(),
  started_at: z.string().optional(),
  ended_at: z.string().optional(),
  lead: leadSchema,
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-retell-signature");
    const signingKey = getRetellSigningKey();

    if (shouldEnforceRetellSignature(signature)) {
      if (!signingKey) {
        return NextResponse.json(
          { ok: false, message: "Webhook signing key not configured" },
          { status: 500 },
        );
      }
      if (!verifyRetellSignature(rawBody, signature, signingKey)) {
        return NextResponse.json(
          { ok: false, message: "Invalid signature" },
          { status: 401 },
        );
      }
    }

    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { ok: false, message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    let voiceEvent: VoiceEventPayload;

    if (isRetellStylePayload(json)) {
      const mapped = mapRetellWebhookToVoiceEvent(
        json as Parameters<typeof mapRetellWebhookToVoiceEvent>[0],
      );
      if ("ignored" in mapped) {
        return NextResponse.json(
          { ok: true, status: "ignored", reason: mapped.reason },
          { status: 200 },
        );
      }
      voiceEvent = mapped;
    } else {
      const parsed = internalBodySchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json(
          {
            ok: false,
            message: "Invalid payload",
            errors: parsed.error.flatten(),
          },
          { status: 400 },
        );
      }
      voiceEvent = parsed.data;
    }

    const result = await ingestVoiceEvent(voiceEvent);
    return NextResponse.json(
      {
        ok: true,
        success: true,
        call_id: result.call_id,
        lead_id: result.lead_id,
        message: result.message,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("voice-event webhook error", error);
    return NextResponse.json(
      { ok: false, message: "Internal error" },
      { status: 500 },
    );
  }
}
