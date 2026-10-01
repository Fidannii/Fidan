import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSimulatorLead } from "@/lib/db/store";
import {
  REAL_ESTATE_GREETING,
  REAL_ESTATE_SIMULATOR_SCRIPT,
} from "@/lib/ai/prompts/realEstateAgent";
import type { TranscriptTurn } from "@/lib/db/types";

const startSchema = z.object({
  action: z.literal("start"),
});

const stepSchema = z.object({
  action: z.literal("step"),
  stepIndex: z.number().int().min(0),
  userMessage: z.string().min(1),
  transcript: z.array(
    z.object({
      role: z.enum(["agent", "user", "system"]),
      content: z.string(),
      timestamp: z.string().optional(),
    }),
  ),
  leadDraft: z.record(z.string(), z.unknown()).optional(),
});

const finishSchema = z.object({
  action: z.literal("finish"),
  transcript: z.array(
    z.object({
      role: z.enum(["agent", "user", "system"]),
      content: z.string(),
      timestamp: z.string().optional(),
    }),
  ),
  leadDraft: z.record(z.string(), z.unknown()),
  duration_seconds: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "start") {
    startSchema.parse(body);
    const greeting: TranscriptTurn = {
      role: "agent",
      content: REAL_ESTATE_GREETING,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json({
      transcript: [greeting],
      stepIndex: 0,
      done: false,
      expectedUserHint: REAL_ESTATE_SIMULATOR_SCRIPT[0]?.user,
    });
  }

  if (body.action === "step") {
    const parsed = stepSchema.parse(body);
    const script = REAL_ESTATE_SIMULATOR_SCRIPT[parsed.stepIndex];
    if (!script) {
      return NextResponse.json(
        { message: "Simulation already complete" },
        { status: 400 },
      );
    }

    const userTurn: TranscriptTurn = {
      role: "user",
      content: parsed.userMessage,
      timestamp: new Date().toISOString(),
    };
    const agentTurn: TranscriptTurn = {
      role: "agent",
      content: script.agent,
      timestamp: new Date().toISOString(),
    };

    const leadDraft = {
      ...(parsed.leadDraft ?? {}),
      ...(script.leadPartial ?? {}),
    };

    const transcript = [...parsed.transcript, userTurn, agentTurn];
    const nextIndex = parsed.stepIndex + 1;
    const done = nextIndex >= REAL_ESTATE_SIMULATOR_SCRIPT.length;

    return NextResponse.json({
      transcript,
      stepIndex: nextIndex,
      done,
      leadDraft,
      expectedUserHint: done
        ? null
        : REAL_ESTATE_SIMULATOR_SCRIPT[nextIndex]?.user,
    });
  }

  if (body.action === "finish") {
    const parsed = finishSchema.parse(body);
    const draft = parsed.leadDraft as Record<string, unknown>;
    const summary =
      typeof draft.notes === "string"
        ? `Simulator: ${String(draft.full_name ?? "Lead")} – ${String(draft.notes)}`
        : `Simulator-Lead ${String(draft.full_name ?? "unbekannt")}`;

    const { call, lead } = await createSimulatorLead({
      transcript: parsed.transcript,
      summary,
      duration_seconds: parsed.duration_seconds,
      lead: {
        full_name: (draft.full_name as string) ?? null,
        phone: (draft.phone as string) ?? null,
        email: (draft.email as string) ?? null,
        intent: (draft.intent as "rent") ?? "rent",
        budget_min: (draft.budget_min as number) ?? null,
        budget_max: (draft.budget_max as number) ?? null,
        preferred_locations: (draft.preferred_locations as string[]) ?? [],
        property_type: (draft.property_type as string) ?? null,
        rooms: (draft.rooms as number) ?? null,
        move_in_date: (draft.move_in_date as string) ?? null,
        urgency: (draft.urgency as "high") ?? "medium",
        notes: (draft.notes as string) ?? summary,
        status: (draft.status as "qualified") ?? "qualified",
        estimated_pipeline_value: 14500,
      },
    });

    return NextResponse.json({ call, lead });
  }

  return NextResponse.json({ message: "Unknown action" }, { status: 400 });
}
