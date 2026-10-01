import { CallSimulator } from "@/components/simulator/call-simulator";

export default function SimulatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-[var(--ink)]">
          Voice Simulator
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Testen Sie den Immobilien-Agenten im Browser, bevor die Nummer live
          geschaltet wird. Der Ablauf spiegelt Begrüßung, Qualifizierung und
          Lead-Erfassung wider.
        </p>
      </div>
      <CallSimulator />
    </div>
  );
}
