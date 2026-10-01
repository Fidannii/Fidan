import Link from "next/link";
import { ArrowRight, PhoneCall, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-6">
        <div className="font-display text-2xl tracking-tight text-[var(--ink)]">
          OpsFlow AI
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] sm:inline"
          >
            Anmelden
          </Link>
          <Link href="/dashboard">
            <Button>Zum Dashboard</Button>
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid min-h-[78vh] w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-6 md:grid-cols-[1.05fr_0.95fr] md:px-6">
        <div className="hero-grid absolute inset-0 -z-10 opacity-70" />
        <div className="animate-fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            OpsFlow AI
          </p>
          <h1 className="mt-3 max-w-xl font-display text-5xl leading-[1.05] tracking-tight text-[var(--ink)] md:text-6xl">
            Der autonome 24/7-Mitarbeiter für Inbound-Sales.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-[var(--ink-muted)]">
            Voice-Agent für Immobilienmakler: nimmt Anrufe entgegen, qualifiziert
            Interessenten und schreibt Leads direkt ins Dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard/simulator">
              <Button size="lg">
                Agent testen
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/leads">
              <Button size="lg" variant="secondary">
                Lead-Pipeline öffnen
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,#b7e0d0_0%,transparent_55%),radial-gradient(circle_at_80%_70%,#dfe8e2_0%,transparent_50%)]" />
          <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--ink)] p-6 text-white shadow-2xl shadow-emerald-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/50">
                  Live Inbound
                </p>
                <p className="font-display text-2xl">Sarah · Nordblick</p>
              </div>
              <span className="animate-pulse-soft rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-200">
                &lt; 800 ms Latency Ziel
              </span>
            </div>
            <div className="mt-8 space-y-3">
              <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-white/10 px-4 py-3 text-sm">
                Guten Tag, Sie sprechen mit Sarah von Nordblick Immobilien.
                Dieses Gespräch kann zur Qualitätssicherung aufgezeichnet werden.
              </div>
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-[var(--accent)] px-4 py-3 text-sm">
                Ich suche eine 3-Zimmer-Wohnung in Winterhude zur Miete.
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-white/10 px-4 py-3 text-sm">
                Gerne. Darf ich Ihren Namen und eine Rückrufnummer notieren?
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center">
              <div>
                <p className="font-display text-2xl">24/7</p>
                <p className="text-[11px] text-white/50">Erreichbarkeit</p>
              </div>
              <div>
                <p className="font-display text-2xl">&lt;2 Min</p>
                <p className="text-[11px] text-white/50">Qualifizierung</p>
              </div>
              <div>
                <p className="font-display text-2xl">87%+</p>
                <p className="text-[11px] text-white/50">Bruttomarge Ziel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)]/70">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3 md:px-6">
          {[
            {
              icon: PhoneCall,
              title: "Inbound Voice",
              body: "Twilio/Retell-Pipeline mit deutschem Prompt für Makler-Qualifizierung.",
            },
            {
              icon: Timer,
              title: "Sofort im CRM-Flow",
              body: "Webhook schreibt Anruf, Transkript und Lead strukturiert ins Dashboard.",
            },
            {
              icon: ShieldCheck,
              title: "DSGVO-ready Pilot",
              body: "Aufzeichnungshinweis, EU-Hosting-Pfad und 30-Tage-Löschkonzept vorbereitet.",
            },
          ].map((item) => (
            <div key={item.title} className="animate-fade-up">
              <item.icon className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="mt-3 font-display text-2xl text-[var(--ink)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
