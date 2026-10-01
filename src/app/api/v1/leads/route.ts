import { NextRequest, NextResponse } from "next/server";
import { listLeads } from "@/lib/db/store";
import type { LeadStatus } from "@/lib/db/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") ?? "all") as LeadStatus | "all";
  const intent = searchParams.get("intent") ?? "all";
  const q = searchParams.get("q") ?? undefined;

  const leads = await listLeads({ status, intent, q });
  return NextResponse.json({ leads });
}
