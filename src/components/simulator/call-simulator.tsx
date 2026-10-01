"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Phone, PhoneOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TranscriptTurn } from "@/lib/db/types";
import { REAL_ESTATE_SIMULATOR_SCRIPT } from "@/lib/ai/prompts/realEstateAgent";

export function CallSimulator() {
  const [active, setActive] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [leadDraft, setLeadDraft] = useState<Record<string, unknown>>({});
  const [done, setDone] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [transcript]);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  async function startCall() {
    setBusy(true);
    setLeadId(null);
    setDone(false);
    setLeadDraft({});
    setSeconds(0);
    const res = await fetch("/api/v1/simulator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    const data = await res.json();
    setTranscript(data.transcript);
    setStepIndex(data.stepIndex);
    setHint(data.expectedUserHint);
    setActive(true);
    setBusy(false);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  async function sendMessage(message?: string) {
    const userMessage = (message ?? input).trim();
    if (!userMessage || busy || done) return;
    setBusy(true);
    setInput("");
    const res = await fetch("/api/v1/simulator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "step",
        stepIndex,
        userMessage,
        transcript,
        leadDraft,
      }),
    });
    const data = await res.json();
    setTranscript(data.transcript);
    setStepIndex(data.stepIndex);
    setHint(data.expectedUserHint);
    setLeadDraft(data.leadDraft ?? {});
    setDone(data.done);
    setBusy(false);

    if (data.done) {
      await finish(data.transcript, data.leadDraft ?? leadDraft);
    }
  }

  async function finish(
    finalTranscript: TranscriptTurn[],
    draft: Record<string, unknown>,
  ) {
    if (timer.current) clearInterval(timer.current);
    setBusy(true);
    const res = await fetch("/api/v1/simulator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "finish",
        transcript: finalTranscript,
        leadDraft: draft,
        duration_seconds: Math.max(seconds, 30),
      }),
    });
    const data = await res.json();
    setLeadId(data.lead?.id ?? null);
    setActive(false);
    setBusy(false);
  }

  function hangUp() {
    if (timer.current) clearInterval(timer.current);
    setActive(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--ink)] px-5 py-4 text-white">
          <div>
            <p className="font-display text-xl">Call Simulator</p>
            <p className="text-xs text-white/60">
              Web-Test für den Immobilien-Voice-Agenten (ohne Telefonie-Provider)
            </p>
          </div>
          <div className="text-right text-sm tabular-nums text-white/80">
            {active ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}` : "00:00"}
            <div className="text-[11px] text-white/50">
              {active ? "Live" : "Bereit"}
            </div>
          </div>
        </div>

        <div
          ref={scroller}
          className="flex h-[420px] flex-col gap-3 overflow-y-auto bg-[linear-gradient(180deg,#f4f7f5_0%,#eef3f0_100%)] p-5"
        >
          {transcript.length === 0 && (
            <div className="m-auto max-w-sm text-center text-sm text-[var(--ink-muted)]">
              Starte einen Testanruf. Sarah begrüßt dich mit dem
              DSGVO-Aufzeichnungshinweis und führt dich durch die Qualifizierung.
            </div>
          )}
          {transcript.map((turn, idx) => (
            <div
              key={`${idx}-${turn.content.slice(0, 12)}`}
              className={`max-w-[85%] animate-fade-up ${
                turn.role === "agent" ? "self-start" : "self-end"
              }`}
            >
              <div
                className={
                  turn.role === "agent"
                    ? "rounded-2xl rounded-tl-md bg-[var(--ink)] px-4 py-3 text-sm text-white shadow-sm"
                    : "rounded-2xl rounded-tr-md bg-white px-4 py-3 text-sm text-[var(--ink)] shadow-sm ring-1 ring-[var(--border)]"
                }
              >
                {turn.content}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4">
          {!active ? (
            <Button onClick={startCall} disabled={busy} className="w-full" size="lg">
              <Phone className="h-4 w-4" />
              Testanruf starten
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={hint ?? "Antwort eingeben…"}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void sendMessage();
                }}
                disabled={busy || done}
              />
              <Button onClick={() => sendMessage()} disabled={busy || done}>
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={hangUp}>
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <h3 className="font-display text-xl text-[var(--ink)]">
            Leitfaden-Schritte
          </h3>
          <ol className="mt-4 space-y-3">
            {REAL_ESTATE_SIMULATOR_SCRIPT.map((step, idx) => (
              <li
                key={step.user}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  idx === stepIndex && active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : idx < stepIndex
                      ? "border-[var(--border)] bg-[var(--surface-2)] opacity-70"
                      : "border-[var(--border)]"
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                  Schritt {idx + 1}
                </p>
                <p className="mt-1 text-[var(--ink)]">{step.user}</p>
                {idx === stepIndex && active && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => sendMessage(step.user)}
                    disabled={busy}
                  >
                    Beispielantwort senden
                  </Button>
                )}
              </li>
            ))}
          </ol>
        </Card>

        {leadId && (
          <Card className="border-[var(--accent)] bg-[var(--accent-soft)]">
            <p className="text-sm font-medium text-[var(--ink)]">
              Lead erfolgreich angelegt
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Der Simulator hat Anruf + Lead in den Demo-Store geschrieben.
            </p>
            <Link
              href={`/dashboard/leads/${leadId}`}
              className="mt-3 inline-flex text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Lead öffnen →
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
