import { notFound } from "next/navigation";
import Link from "next/link";
import { getCall, getLead } from "@/lib/db/store";
import { LeadDetail } from "@/components/leads/lead-detail";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();
  const call = lead.call_id ? await getCall(lead.call_id) : null;

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/leads"
        className="text-sm text-[var(--accent)] hover:underline"
      >
        ← Zurück zu Leads
      </Link>
      <LeadDetail initialLead={lead} call={call} />
    </div>
  );
}
