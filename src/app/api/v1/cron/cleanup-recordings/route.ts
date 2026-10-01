import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredRecordings } from "@/lib/db/retention";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorize(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization");

  // Spec: if CRON_SECRET is set, require Bearer match
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  // Without secret: allow only outside production (local/demo)
  return process.env.NODE_ENV !== "production";
}

async function handle(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredRecordings(30);
    return NextResponse.json({
      success: true,
      ok: true,
      cleanedRecordings: result.cleaned_count,
      cleaned_count: result.cleaned_count,
      backend: result.backend,
      cutoff: result.cutoff,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Fehler beim Audio-Cleanup:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cleanup failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
