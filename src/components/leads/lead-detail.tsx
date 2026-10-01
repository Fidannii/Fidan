"use client";

import { useState } from "react";
import type { Call, Lead } from "@/lib/db/types";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { formatEuro, intentLabel, statusLabel } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export function LeadDetail({
  initialLead,
  call,
}: {
  initialLead: Lead;
  call: Call | null;
}) {
  const [lead, setLead] = useState(initialLead);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/v1/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: lead.full_name,
        phone: lead.phone,
        email: lead.email,
        status: lead.status,
        notes: lead.notes,
        intent: lead.intent,
      }),
    });
    const data = await res.json();
    setLead(data.lead);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <Card>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl tracking-tight text-[var(--ink)]">
                {lead.full_name ?? "Unbekannter Lead"}
              </h1>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {intentLabel(lead.intent)} · Score {lead.qualification_score} ·
                Pipeline {formatEuro(lead.estimated_pipeline_value)}
              </p>
            </div>
            <Badge tone={statusTone(lead.status)}>
              {statusLabel(lead.status)}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="full_name">Name</Label>
              <Input
                id="full_name"
                value={lead.full_name ?? ""}
                onChange={(e) =>
                  setLead({ ...lead, full_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={lead.phone ?? ""}
                onChange={(e) => setLead({ ...lead, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                value={lead.email ?? ""}
                onChange={(e) => setLead({ ...lead, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={lead.status}
                onChange={(e) =>
                  setLead({
                    ...lead,
                    status: e.target.value as Lead["status"],
                  })
                }
              >
                <option value="new">Neu</option>
                <option value="qualified">Qualifiziert</option>
                <option value="contacted">Kontaktiert</option>
                <option value="appointment">Termin</option>
                <option value="won">Gewonnen</option>
                <option value="lost">Verloren</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={lead.notes ?? ""}
                onChange={(e) => setLead({ ...lead, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? "Speichern…" : "Änderungen speichern"}
            </Button>
            {saved && (
              <span className="text-sm text-emerald-700">Gespeichert</span>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-xl text-[var(--ink)]">
            Qualifizierungsprofil
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-[var(--ink-muted)]">Lagen</dt>
              <dd className="font-medium">
                {lead.preferred_locations.join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Objekt</dt>
              <dd className="font-medium">
                {lead.property_type ?? "—"}
                {lead.rooms ? ` · ${lead.rooms} Zi.` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Budget</dt>
              <dd className="font-medium">
                {lead.budget_min || lead.budget_max
                  ? `${formatEuro(lead.budget_min)} – ${formatEuro(lead.budget_max)}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Dringlichkeit</dt>
              <dd className="font-medium capitalize">
                {lead.urgency ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Einzug / Kaufzeit</dt>
              <dd className="font-medium">{lead.move_in_date ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Erfasst</dt>
              <dd className="font-medium">
                {format(new Date(lead.created_at), "dd.MM.yyyy HH:mm", {
                  locale: de,
                })}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-3 font-display text-xl text-[var(--ink)]">
            Anruf & Transkript
          </h2>
          {call ? (
            <>
              <div className="mb-4 flex flex-wrap gap-3 text-sm text-[var(--ink-muted)]">
                <span>{call.duration_seconds}s</span>
                <span>·</span>
                <span>{call.direction}</span>
                <span>·</span>
                <span>{call.from_number ?? "Simulator"}</span>
              </div>

              <div className="mb-4 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                  Audio
                </p>
                {call.recording_url ? (
                  <audio controls className="mt-2 w-full" src={call.recording_url}>
                    Aufnahme
                  </audio>
                ) : (
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    Keine Aufnahme hinterlegt (Demo). In Produktion erscheint
                    hier der Retell/Twilio Recording-Player.
                  </p>
                )}
              </div>

              {call.summary && (
                <p className="mb-4 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--ink)]">
                  {call.summary}
                </p>
              )}

              <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
                {call.transcript.map((turn, idx) => (
                  <div
                    key={`${idx}-${turn.role}`}
                    className={
                      turn.role === "agent"
                        ? "rounded-2xl rounded-tl-sm bg-[var(--ink)] px-3 py-2 text-sm text-white"
                        : "rounded-2xl rounded-tr-sm bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
                    }
                  >
                    <p className="mb-1 text-[10px] uppercase tracking-wide opacity-60">
                      {turn.role === "agent" ? "Sarah (KI)" : "Anrufer"}
                    </p>
                    {turn.content}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--ink-muted)]">
              Kein verknüpfter Anruf vorhanden.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
