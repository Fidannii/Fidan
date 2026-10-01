import { listLeads } from "@/lib/db/store";
import { LeadsTable } from "@/components/leads/leads-table";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await listLeads();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-[var(--ink)]">
          Leads
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Qualifizierte Anfragen aus Voice-Agent und Simulator – filterbar nach
          Status und Absicht (Miete/Kauf).
        </p>
      </div>
      <LeadsTable leads={leads} />
    </div>
  );
}
