/**
 * Phase 4/6/V3 — dynamic choice events with delayed effects + seeded picks.
 */

import type { Game } from './types';
import { getSim } from './systems';
import { computeTraffic } from './traffic';
import { ensureRuntime, nowOf, rngOf } from './clock';

export interface GameEvent {
  id: string;
  title: string;
  body: string;
  investCost: number;
  investLabel: string;
  ignoreLabel: string;
  /** optional third choice label */
  altLabel?: string;
  weight?: number;
  cooldownMs?: number;
}

const POOL: GameEvent[] = [
  {
    id: 'storm',
    title: 'Sturmwarnung',
    body: 'Ein Sturm zieht auf. Vorsorge schützt Zufriedenheit und Gebäude.',
    investCost: 80,
    investLabel: 'Vorsorge (80¢)',
    ignoreLabel: 'Ignorieren',
    weight: 1,
    cooldownMs: 180_000,
  },
  {
    id: 'festival',
    title: 'Stadtfest',
    body: 'Ein Festival würde Gewerbe ankurbeln — kostet aber Vorbereitung.',
    investCost: 60,
    investLabel: 'Festival (60¢)',
    ignoreLabel: 'Absagen',
    weight: 1.2,
    cooldownMs: 150_000,
  },
  {
    id: 'firm',
    title: 'Firmenansiedlung',
    body: 'Ein Betrieb will sich ansiedeln. Subvention = mehr Jobs, mehr Verkehr.',
    investCost: 100,
    investLabel: 'Subvention (100¢)',
    ignoreLabel: 'Ablehnen',
    altLabel: 'Kleine Ansiedlung (−40¢)',
    weight: 1.1,
    cooldownMs: 200_000,
  },
  {
    id: 'heat',
    title: 'Hitzewelle',
    body: 'Kühlung & Wasser sichern — sonst sinkt die Zufriedenheit.',
    investCost: 70,
    investLabel: 'Maßnahmen (70¢)',
    ignoreLabel: 'Aussitzen',
    weight: 1,
    cooldownMs: 160_000,
  },
  {
    id: 'logistics',
    title: 'Logistikzentrum',
    body: 'Großprojekt: Jobs und Steuern, aber Verkehr und Emissionen steigen.',
    investCost: 140,
    investLabel: 'Groß (+Jobs/+Traffic)',
    ignoreLabel: 'Absagen (+Umwelt)',
    altLabel: 'Mittel (+Zuschuss)',
    weight: 0.9,
    cooldownMs: 240_000,
  },
];

export function ensureEvents(g: Game) {
  ensureRuntime(g);
  if (g.nextEventAt == null) g.nextEventAt = nowOf(g) + 90_000;
  if (g.activeEvent === undefined) g.activeEvent = null;
  if (g.eventPrep == null) g.eventPrep = 0;
  if (!g.pendingEffects) g.pendingEffects = [];
  if (!g.eventCooldowns) g.eventCooldowns = {};
}

function pickWeighted(g: Game): GameEvent {
  const rng = rngOf(g);
  const now = nowOf(g);
  const available = POOL.filter((ev) => (g.eventCooldowns?.[ev.id] || 0) <= now);
  const pool = available.length ? available : POOL;
  const weights = pool.map((e) => e.weight ?? 1);
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = rng.next() * sum;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}

export function tickEvents(g: Game, say: (m: string) => void) {
  ensureEvents(g);
  if (g.activeEvent) return;
  const now = nowOf(g);
  if (now < (g.nextEventAt || 0)) return;
  const sim = getSim(g);
  if (sim.pop < 4) {
    g.nextEventAt = now + 60_000;
    return;
  }
  const ev = pickWeighted(g);
  g.activeEvent = ev;
  say(`Ereignis: ${ev.title}`);
}

export function applyPendingEffects(g: Game, say: (m: string) => void) {
  ensureEvents(g);
  const now = nowOf(g);
  const keep: NonNullable<Game['pendingEffects']> = [];
  for (const fx of g.pendingEffects || []) {
    if (fx.atSim > now) {
      keep.push(fx);
      continue;
    }
    if (fx.kind === 'traffic_followup') {
      const cong = g.traffic?.congestion ?? 0;
      if (cong > 55) {
        g.disasterUntil = now + 40_000;
        say('Folge: Überlastete Zufahrt — Belastung steigt.');
      } else {
        say('Zufahrt hält der Last stand.');
      }
    } else if (fx.kind === 'cash') {
      const n = Number(fx.payload?.amount || 0);
      g.cash += n;
      say(`Spätfolge: ${n >= 0 ? '+' : ''}${n}¢`);
    }
  }
  g.pendingEffects = keep;
}

export function resolveEvent(
  g: Game,
  choice: 'invest' | 'ignore',
  say: (m: string) => void,
): boolean {
  ensureEvents(g);
  const ev = g.activeEvent;
  if (!ev) return false;
  const now = nowOf(g);
  const def = POOL.find((p) => p.id === ev.id);

  if (choice === 'invest') {
    if (g.cash < ev.investCost) {
      say('Zu wenig Credits.');
      return false;
    }
    g.cash -= ev.investCost;
    g.eventPrep = (g.eventPrep || 0) + 1;
    if (ev.id === 'festival') {
      g.cash += 40;
      say('Festival: +40¢ Einnahmen, Stadt feiert.');
    } else if (ev.id === 'firm') {
      g.tokens += 1;
      g.pendingEffects!.push({
        id: `firm-traffic-${now}`,
        atSim: now + 90_000,
        kind: 'traffic_followup',
      });
      say('Ansiedlung: +1 Token — später Verkehrsprüfung.');
    } else if (ev.id === 'logistics') {
      g.tokens += 2;
      g.cash += 80;
      g.pendingEffects!.push({
        id: `log-traffic-${now}`,
        atSim: now + 120_000,
        kind: 'traffic_followup',
      });
      say('Logistikzentrum: Jobs/Steuern jetzt, Verkehr später.');
    } else if (ev.id === 'storm') {
      g.disasterUntil = null;
      say('Vorsorge erfolgreich — Sturm abgefangen.');
    } else {
      say('Maßnahmen greifen.');
    }
  } else {
    // ignore / alt-path
    if (ev.id === 'storm' || ev.id === 'heat') {
      g.disasterUntil = now + 45_000;
      say('Keine Vorsorge — Belastung steigt.');
    } else if (ev.id === 'logistics') {
      say('Keine Ansiedlung — Umwelt/Zufriedenheit bleiben stabiler.');
      g.eventPrep = (g.eventPrep || 0) + 1;
    } else {
      say('Chance vertan.');
    }
  }

  if (def?.cooldownMs) {
    g.eventCooldowns![ev.id] = now + def.cooldownMs;
  }
  g.activeEvent = null;
  const rng = rngOf(g);
  g.nextEventAt = now + 120_000 + Math.floor(rng.next() * 90_000);
  return true;
}

export function eventHint(g: Game): string | null {
  const tr = g.traffic ?? computeTraffic(g);
  if (tr.congestion > 70) return 'Stau kritisch — Straßen ausbauen, Buslinie oder Stationen.';
  const sim = getSim(g);
  if (sim.sat < 40) return 'Zufriedenheit niedrig — Ursachen im Stadt-Tab prüfen.';
  return null;
}
