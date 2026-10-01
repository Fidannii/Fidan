import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getDashboardStats, listCalls, listLeads } from "@/lib/db/store";
import { formatEuro, intentLabel, statusLabel } from "@/lib/utils";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, leads, calls] = await Promise.all([
    getDashboardStats(),
    listLeads(),
    listCalls(),
  ]);

  const recent = leads.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">
            {stats.organization.name}
          </p>
          <h1 className="font-display text-4xl tracking-tight text-[var(--ink)]">
            Revenue & Operations
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
            Ihr 24/7-Agent nimmt Anrufe entgegen, qualifiziert Interessenten und
            füllt die Pipeline – auch außerhalb der Bürozeiten.
          </p>
        </div>
        <Link href="/dashboard/simulator">
          <Button size="lg">Testanruf starten</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Leads gesamt", value: String(stats.totalLeads) },
          { label: "Qualifiziert", value: String(stats.qualifiedLeads) },
          {
            label: "Pipeline-Wert",
            value: formatEuro(stats.pipelineValue),
          },
          {
            label: "Conversion",
            value: `${stats.conversionRate}%`,
          },
        ].map((item) => (
          <Card key={item.label} className="animate-fade-up">
            <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
              {item.label}
            </p>
            <p className="mt-2 font-display text-3xl text-[var(--ink)]">
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Neueste Leads</h2>
            <Link
              href="/dashboard/leads"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Alle ansehen
            </Link>
          </div>
          <ul className="space-y-3">
            {recent.map((lead) => (
              <li
                key={lead.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-3"
              >
                <div>
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    className="font-medium hover:text-[var(--accent)]"
                  >
                    {lead.full_name}
                  </Link>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {intentLabel(lead.intent)} · Score {lead.qualification_score}
                  </p>
                </div>
                <Badge tone={statusTone(lead.status)}>
                  {statusLabel(lead.status)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 font-display text-2xl">Letzte Anrufe</h2>
          <ul className="space-y-3">
            {calls.slice(0, 5).map((call) => (
              <li
                key={call.id}
                className="rounded-lg border border-[var(--border)] px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">
                    {call.from_number ?? "Simulator"}
                  </p>
                  <span className="text-xs text-[var(--ink-muted)]">
                    {call.duration_seconds}s
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-muted)]">
                  {call.summary ?? "Kein Summary"}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
