import { getStore } from "@/lib/db/store";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const store = await getStore();
  const agent = store.agents[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-[var(--ink)]">
          Agenten
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Voice-Agenten für Inbound-Qualifizierung. Live-Verknüpfung mit
          Retell/Twilio über Env-Variablen.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">{agent.name}</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Stimme: {agent.voice_id} · Vertical: Immobilien
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Nummer: {agent.phone_number}
            </p>
          </div>
          <Badge tone="success">Live</Badge>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
            System Prompt (Auszug)
          </p>
          <pre className="max-h-80 overflow-auto rounded-lg bg-[var(--ink)] p-4 text-xs leading-relaxed text-white/85 whitespace-pre-wrap">
            {agent.system_prompt.slice(0, 1200)}…
          </pre>
        </div>
      </Card>
    </div>
  );
}
