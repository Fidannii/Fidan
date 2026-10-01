import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ingestVoiceEvent } from "@/lib/db/store";

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

const bodySchema = z.object({
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
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
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

    const result = await ingestVoiceEvent(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("voice-event webhook error", error);
    return NextResponse.json(
      { ok: false, message: "Internal error" },
      { status: 500 },
    );
  }
}
