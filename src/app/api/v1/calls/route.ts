import { NextResponse } from "next/server";
import { getDashboardStats, listCalls } from "@/lib/db/store";

export async function GET() {
  const [stats, calls] = await Promise.all([getDashboardStats(), listCalls()]);
  return NextResponse.json({ stats, calls });
}
