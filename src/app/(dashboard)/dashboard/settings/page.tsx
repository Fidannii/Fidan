import { Card } from "@/components/ui/card";
import { getActiveDataBackend } from "@/lib/db/store";

export const dynamic = "force-dynamic";

const checklist = [
  {
    title: "Einwilligung zur Aufzeichnung",
    body: "Der Agent spricht bei Gesprächsbeginn den Hinweis zur Qualitätssicherung.",
    done: true,
  },
  {
    title: "AV-Vertrag / EU-Hosting",
    body: "Supabase EU (Frankfurt), Vercel und Telefonie-Provider vertraglich absichern.",
    done: false,
  },
  {
    title: "Löschkonzept Audio",
    body: "30-Tage Cleanup via cleanup_expired_recordings() + /api/v1/cron/cleanup-recordings.",
    done: true,
  },
  {
    title: "Webhook-Signatur",
    body: "HMAC-Prüfung für Retell (x-retell-signature) ist implementiert; Secret in Prod setzen.",
    done: true,
  },
];

export default function SettingsPage() {
  const backend = getActiveDataBackend();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-[var(--ink)]">
          Einstellungen & DSGVO
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Pilotkunden-Checkliste für Datenschutz und Betriebsbereitschaft.
        </p>
      </div>

      <Card>
        <h2 className="font-display text-xl">Data Backend</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Aktiv:{" "}
          <span className="font-medium text-[var(--ink)]">
            {backend === "supabase" ? "Supabase" : "Demo-Store (JSON)"}
          </span>
        </p>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Umschalten über `DATA_BACKEND` bzw. Supabase-Env-Keys. Details:
          `docs/supabase-setup.md`.
        </p>
      </Card>

      <div className="grid gap-4">
        {checklist.map((item) => (
          <Card key={item.title}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium text-[var(--ink)]">{item.title}</h2>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  {item.body}
                </p>
              </div>
              <span
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  item.done
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {item.done ? "Umgesetzt" : "Offen"}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-display text-xl">Environment</h2>
        <pre className="mt-3 overflow-auto rounded-lg bg-[var(--surface-2)] p-4 text-xs text-[var(--ink-muted)]">
{`NEXT_PUBLIC_APP_URL=
RETELL_API_KEY=
RETELL_WEBHOOK_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=`}
        </pre>
      </Card>
    </div>
  );
}
