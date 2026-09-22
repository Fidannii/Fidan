/**
 * Phase 4/6 — dynamic choice events (agency, not pure punishment).
 */

import type { Game } from './types';
import { getSim } from './systems';
import { computeTraffic } from './traffic';

export interface GameEvent {
  id: string;
  title: string;
  body: string;
  investCost: number;
  investLabel: string;
  ignoreLabel: string;
}

const POOL: GameEvent[] = [
  {
    id: 'storm',
    title: 'Sturmwarnung',
    body: 'Ein Sturm zieht auf. Vorsorge schützt Zufriedenheit und Gebäude.',
    investCost: 80,
    investLabel: 'Vorsorge (80¢)',
    ignoreLabel: 'Ignorieren',
  },
  {
    id: 'festival',
    title: 'Stadtfest',
    body: 'Ein Festival würde Gewerbe ankurbeln — kostet aber Vorbereitung.',
    investCost: 60,
    investLabel: 'Festival (60¢)',
    ignoreLabel: 'Absagen',
  },
  {
    id: 'firm',
    title: 'Firmenansiedlung',
    body: 'Ein Betrieb will sich ansiedeln. Subvention = mehr Jobs.',
    investCost: 100,
    investLabel: 'Subvention (100¢)',
    ignoreLabel: 'Ablehnen',
  },
  {
    id: 'heat',
    title: 'Hitzewelle',
    body: 'Kühlung & Wasser sichern — sonst sinkt die Zufriedenheit.',
    investCost: 70,
    investLabel: 'Maßnahmen (70¢)',
    ignoreLabel: 'Aussitzen',
  },
];

export function ensureEvents(g: Game) {
  if (g.nextEventAt == null) g.nextEventAt = Date.now() + 90_000;
  if (g.activeEvent === undefined) g.activeEvent = null;
  if (g.eventPrep == null) g.eventPrep = 0;
}

export function tickEvents(g: Game, say: (m: string) => void) {
  ensureEvents(g);
  if (g.activeEvent) return;
  const now = Date.now();
  if (now < (g.nextEventAt || 0)) return;
  const sim = getSim(g);
  if (sim.pop < 4) {
    g.nextEventAt = now + 60_000;
    return;
  }
  const ev = POOL[Math.floor(Math.random() * POOL.length)];
  g.activeEvent = ev;
  say(`Ereignis: ${ev.title}`);
}

export function resolveEvent(
  g: Game,
  choice: 'invest' | 'ignore',
  say: (m: string) => void,
): boolean {
  ensureEvents(g);
  const ev = g.activeEvent;
  if (!ev) return false;
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
      say('Ansiedlung: +1 Token (Jobs folgen).');
    } else if (ev.id === 'storm') {
      g.disasterUntil = null;
      say('Vorsorge erfolgreich — Sturm abgefangen.');
    } else {
      say('Maßnahmen greifen.');
    }
  } else {
    if (ev.id === 'storm' || ev.id === 'heat') {
      g.disasterUntil = Date.now() + 45_000;
      say('Keine Vorsorge — Belastung steigt.');
    } else {
      say('Chance vertan.');
    }
  }
  g.activeEvent = null;
  g.nextEventAt = Date.now() + 120_000 + Math.floor(Math.random() * 90_000);
  return true;
}

export function eventHint(g: Game): string | null {
  const tr = g.traffic ?? computeTraffic(g);
  if (tr.congestion > 70) return 'Stau kritisch — Straßen ausbauen oder Stationen.';
  const sim = getSim(g);
  if (sim.sat < 40) return 'Zufriedenheit niedrig — Ursachen im Stadt-Tab prüfen.';
  return null;
}
