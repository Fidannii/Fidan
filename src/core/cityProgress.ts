/**
 * Phase 4 — city status, specialization, strategic goals.
 */

import { HOUSE } from './catalog';
import type { Game, RegionId } from './types';
import { computeTraffic } from './traffic';

export type CityTier = 'dorf' | 'kleinstadt' | 'stadt' | 'grossstadt' | 'metropole';
export type SpecId = 'none' | 'green' | 'industry' | 'finance' | 'tourism';

export interface SpecDef {
  id: SpecId;
  name: string;
  blurb: string;
  icon: string;
  needTier: number;
}

export const SPECS: SpecDef[] = [
  { id: 'none', name: 'Offen', blurb: 'Keine Spezialisierung.', icon: '🏙️', needTier: 0 },
  {
    id: 'green',
    name: 'Green City',
    blurb: '+Zufriedenheit, −Umwelt; teurere saubere Infrastruktur.',
    icon: '🌿',
    needTier: 1,
  },
  {
    id: 'industry',
    name: 'Industriezentrum',
    blurb: '+Produktion & Jobs; mehr Umwelt & Verkehr.',
    icon: '🏭',
    needTier: 2,
  },
  {
    id: 'finance',
    name: 'Finanzmetropole',
    blurb: '+Steuern; braucht Bildung & niedrigen Stau.',
    icon: '💼',
    needTier: 3,
  },
  {
    id: 'tourism',
    name: 'Tourismusstadt',
    blurb: '+Gewerbe aus Parks/Sehenswürdigkeiten.',
    icon: '🗼',
    needTier: 2,
  },
];

const TIERS: Array<{ id: CityTier; name: string; pop: number }> = [
  { id: 'dorf', name: 'Dorf', pop: 0 },
  { id: 'kleinstadt', name: 'Kleinstadt', pop: 40 },
  { id: 'stadt', name: 'Stadt', pop: 120 },
  { id: 'grossstadt', name: 'Großstadt', pop: 280 },
  { id: 'metropole', name: 'Metropole', pop: 500 },
];

function popOf(g: Game): number {
  let pop = 0;
  for (const c of g.cells) {
    if (c.b?.id !== 'house') continue;
    const tier = HOUSE[Math.min(c.b.level, HOUSE.length) - 1];
    pop += tier.pop;
  }
  return pop;
}

export function tierIndex(id: CityTier): number {
  return Math.max(0, TIERS.findIndex((t) => t.id === id));
}

export function cityTierOf(g: Game): {
  id: CityTier;
  name: string;
  next: string | null;
  progress: number;
} {
  const pop = popOf(g);
  let cur = TIERS[0];
  for (const t of TIERS) {
    if (pop >= t.pop) cur = t;
  }
  const idx = tierIndex(cur.id);
  const next = TIERS[idx + 1] ?? null;
  const progress = next
    ? Math.min(100, Math.round(((pop - cur.pop) / Math.max(1, next.pop - cur.pop)) * 100))
    : 100;
  return { id: cur.id, name: cur.name, next: next?.name ?? null, progress };
}

export function ensureProgression(g: Game) {
  if (!g.specialization) g.specialization = 'none';
  const t = cityTierOf(g);
  if (!g.cityTier) g.cityTier = t.id;
  else if (tierIndex(t.id) > tierIndex(g.cityTier)) g.cityTier = t.id;
}

export function setSpecialization(g: Game, id: SpecId, say: (m: string) => void): boolean {
  ensureProgression(g);
  const def = SPECS.find((s) => s.id === id);
  if (!def) return false;
  const tier = cityTierOf(g);
  if (tierIndex(tier.id) < def.needTier) {
    say(`Braucht Stadtstatus ab „${TIERS[def.needTier].name}“.`);
    return false;
  }
  g.specialization = id;
  say(`Spezialisierung: ${def.name}`);
  return true;
}

export function specModifiers(g: Game): {
  taxMult: number;
  happiness: number;
  pollutionFeel: number;
  commerceMult: number;
  trafficFeel: number;
} {
  ensureProgression(g);
  switch (g.specialization) {
    case 'green':
      return { taxMult: 0.95, happiness: 6, pollutionFeel: -0.35, commerceMult: 1.05, trafficFeel: 0 };
    case 'industry':
      return { taxMult: 1.05, happiness: -3, pollutionFeel: 0.4, commerceMult: 0.95, trafficFeel: 0.15 };
    case 'finance':
      return { taxMult: 1.18, happiness: 0, pollutionFeel: 0, commerceMult: 1.1, trafficFeel: -0.05 };
    case 'tourism':
      return { taxMult: 1.0, happiness: 4, pollutionFeel: -0.1, commerceMult: 1.25, trafficFeel: 0.05 };
    default:
      return { taxMult: 1, happiness: 0, pollutionFeel: 0, commerceMult: 1, trafficFeel: 0 };
  }
}

export function strategicGoals(
  g: Game,
  sat: number,
  healthLoad: number,
): Array<{ id: string; title: string; done: boolean; blurb: string }> {
  const tr = g.traffic ?? computeTraffic(g);
  const tier = cityTierOf(g);
  return [
    {
      id: 'sat80',
      title: 'Zufriedenheit ≥ 80%',
      done: sat >= 80,
      blurb: `Aktuell ${sat}%`,
    },
    {
      id: 'cong40',
      title: 'Stau unter 40%',
      done: tr.congestion < 40,
      blurb: `Aktuell ${tr.congestion}%`,
    },
    {
      id: 'health',
      title: 'Gesundheit gut (<90% Last)',
      done: healthLoad < 90,
      blurb: `Last ${healthLoad}%`,
    },
    {
      id: 'metro',
      title: 'Metropolenstatus',
      done: tier.id === 'metropole',
      blurb: tier.next ? `Als Nächstes: ${tier.next}` : 'Erreicht',
    },
  ];
}

export function regionLabel(id: RegionId): string {
  return id;
}
