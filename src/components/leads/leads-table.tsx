"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Lead } from "@/lib/db/types";
import { Badge, statusTone } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { formatEuro, intentLabel, statusLabel } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [status, setStatus] = useState("all");
  const [intent, setIntent] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (intent !== "all" && l.intent !== intent) return false;
      if (q) {
        const hay = `${l.full_name ?? ""} ${l.phone ?? ""} ${l.email ?? ""} ${l.preferred_locations.join(" ")}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [leads, status, intent, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <Input
            placeholder="Suche nach Name, Telefon, Lage…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="md:w-44">
          <option value="all">Alle Status</option>
          <option value="new">Neu</option>
          <option value="qualified">Qualifiziert</option>
          <option value="contacted">Kontaktiert</option>
          <option value="appointment">Termin</option>
        </Select>
        <Select value={intent} onChange={(e) => setIntent(e.target.value)} className="md:w-44">
          <option value="all">Alle Absichten</option>
          <option value="rent">Miete</option>
          <option value="buy">Kauf</option>
          <option value="sell">Verkauf</option>
          <option value="finance">Finanzierung</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Absicht</th>
              <th className="px-4 py-3 font-medium">Budget</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Erfasst</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr
                key={lead.id}
                className="border-t border-[var(--border)] transition-colors hover:bg-[var(--surface-2)]/70"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    className="font-medium text-[var(--ink)] hover:text-[var(--accent)]"
                  >
                    {lead.full_name ?? "Unbekannt"}
                  </Link>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {lead.phone ?? "—"}
                    {lead.preferred_locations.length > 0
                      ? ` · ${lead.preferred_locations.join(", ")}`
                      : ""}
                  </p>
                </td>
                <td className="px-4 py-3">{intentLabel(lead.intent)}</td>
                <td className="px-4 py-3">
                  {lead.budget_max
                    ? formatEuro(lead.budget_max)
                    : lead.budget_min
                      ? `ab ${formatEuro(lead.budget_min)}`
                      : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium tabular-nums">
                    {lead.qualification_score}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(lead.status)}>
                    {statusLabel(lead.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[var(--ink-muted)]">
                  {format(new Date(lead.created_at), "dd.MM.yyyy HH:mm", {
                    locale: de,
                  })}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-[var(--ink-muted)]"
                >
                  Keine Leads für diese Filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
