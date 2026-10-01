import { NextRequest, NextResponse } from "next/server";
import { getCall, getLead, updateLead } from "@/lib/db/store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ message: "Lead not found" }, { status: 404 });
  }
  const call = lead.call_id ? await getCall(lead.call_id) : null;
  return NextResponse.json({ lead, call });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await req.json();
  const updated = await updateLead(id, body);
  if (!updated) {
    return NextResponse.json({ message: "Lead not found" }, { status: 404 });
  }
  return NextResponse.json({ lead: updated });
}
