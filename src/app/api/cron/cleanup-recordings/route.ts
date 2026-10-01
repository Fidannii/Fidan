import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredRecordings } from "@/lib/db/retention";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // Allow in non-production for local ops; block in production without secret
    return process.env.NODE_ENV !== "production";
  }
  const header = req.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : null;
  const querySecret = req.nextUrl.searchParams.get("secret");
  return bearer === secret || querySecret === secret;
}

async function handle(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const daysParam = req.nextUrl.searchParams.get("days");
  const retentionDays = daysParam ? Number(daysParam) : 30;

  try {
    const result = await cleanupExpiredRecordings(
      Number.isFinite(retentionDays) ? retentionDays : 30,
    );
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("cleanup-recordings cron error", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Cleanup failed",
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
