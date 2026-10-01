import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  REAL_ESTATE_GREETING,
  REAL_ESTATE_SIMULATOR_SCRIPT,
} from "@/lib/ai/prompts/realEstateAgent";
import { ingestRetellCompatibleEvent } from "@/lib/retell/ingestRetellCompatibleEvent";
import { mapSimulatorFinishToRetellEvent } from "@/lib/retell/mapSimulatorToRetell";
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

    try {
      // 1) Simulator state → Retell-compatible event
      // 2) Same mapper + ingestVoiceEvent path as live webhooks
      const simulatedEvent = mapSimulatorFinishToRetellEvent({
        transcript: parsed.transcript,
        leadDraft: parsed.leadDraft,
        duration_seconds: parsed.duration_seconds,
      });

      const { call, lead, leadId } = await ingestRetellCompatibleEvent(
        simulatedEvent,
        { direction: "simulator" },
      );

      // Keep existing UI contract for /dashboard/simulator
      return NextResponse.json({
        call,
        lead,
        success: true,
        leadId,
      });
    } catch (error) {
      console.error("simulator finish ingestion error", error);
      return NextResponse.json(
        {
          message:
            error instanceof Error
              ? error.message
              : "Simulator ingestion failed",
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ message: "Unknown action" }, { status: 400 });
}
