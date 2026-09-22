/**
 * Simulation Core 2.0 — Economy, Population, Demand, Services, Land Value, Happiness.
 * Computed on tax ticks / UI refresh (not every render frame).
 */

import { DEFS, HOUSE } from './catalog';
import type {
  BuildId,
  CashflowSnap,
  CitySim,
  DemandSnap,
  Game,
  HappinessCause,
  ServiceSnap,
} from './types';
import { cell, covered, roadNext } from './world';
import { ensureProgression, specModifiers } from './cityProgress';

export interface EcoDef {
  maintenance: number;
  jobs: number;
  pollution: number;
  serviceCapacity?: number;
  commerce?: number;
}

export const ECO: Record<BuildId, EcoDef> = {
  road: { maintenance: 0.2, jobs: 0, pollution: 0 },
  highway: { maintenance: 0.6, jobs: 0, pollution: 1 },
  house: { maintenance: 1, jobs: 0, pollution: 0 },
  woodcutter: { maintenance: 2, jobs: 4, pollution: 1 },
  mine: { maintenance: 4, jobs: 8, pollution: 4 },
  chem: { maintenance: 5, jobs: 10, pollution: 6 },
  plastics: { maintenance: 4, jobs: 8, pollution: 3 },
  glassworks: { maintenance: 4, jobs: 7, pollution: 3 },
  sawmill: { maintenance: 3, jobs: 6, pollution: 2 },
  workshop: { maintenance: 3, jobs: 6, pollution: 2 },
  textile: { maintenance: 3, jobs: 7, pollution: 2 },
  furniture: { maintenance: 4, jobs: 8, pollution: 2 },
  power: { maintenance: 6, jobs: 5, pollution: 7, serviceCapacity: 28 },
  solar: { maintenance: 5, jobs: 3, pollution: 0, serviceCapacity: 32 },
  water: { maintenance: 3, jobs: 2, pollution: 0, serviceCapacity: 30 },
  sewage: { maintenance: 4, jobs: 3, pollution: 1, serviceCapacity: 28 },
  waste: { maintenance: 4, jobs: 4, pollution: 2, serviceCapacity: 26 },
  police: { maintenance: 5, jobs: 6, pollution: 0, serviceCapacity: 36 },
  fire: { maintenance: 5, jobs: 6, pollution: 0, serviceCapacity: 36 },
  hospital: { maintenance: 8, jobs: 12, pollution: 0, serviceCapacity: 40 },
  park: { maintenance: 2, jobs: 1, pollution: 0 },
  school: { maintenance: 6, jobs: 8, pollution: 0, serviceCapacity: 45 },
  uni: { maintenance: 10, jobs: 14, pollution: 0, serviceCapacity: 60 },
  station: { maintenance: 5, jobs: 6, pollution: 1, commerce: 4 },
  airport: { maintenance: 14, jobs: 20, pollution: 5, commerce: 12 },
  cinema: { maintenance: 4, jobs: 5, pollution: 0, commerce: 6 },
  stadium: { maintenance: 8, jobs: 10, pollution: 1, commerce: 10 },
  landmark: { maintenance: 3, jobs: 2, pollution: 0, commerce: 5 },
  depot: { maintenance: 4, jobs: 5, pollution: 2, commerce: 3 },
};

export type ServiceKind =
  | 'power'
  | 'water'
  | 'sewage'
  | 'waste'
  | 'health'
  | 'safety'
  | 'education'
  | 'fire';

const SERVICE_MAP: Array<{ kind: ServiceKind; label: string; ids: BuildId[] }> = [
  { kind: 'power', label: 'Strom', ids: ['power', 'solar'] },
  { kind: 'water', label: 'Wasser', ids: ['water'] },
  { kind: 'sewage', label: 'Abwasser', ids: ['sewage'] },
  { kind: 'waste', label: 'Müll', ids: ['waste'] },
  { kind: 'health', label: 'Gesundheit', ids: ['hospital'] },
  { kind: 'safety', label: 'Sicherheit', ids: ['police'] },
  { kind: 'fire', label: 'Feuerwehr', ids: ['fire'] },
  { kind: 'education', label: 'Bildung', ids: ['school', 'uni'] },
];

function inRadius(ax: number, ay: number, bx: number, by: number, r: number) {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by)) <= r;
}

function serviceProviders(g: Game, ids: BuildId[]) {
  const out: Array<{ x: number; y: number; cap: number; r: number }> = [];
  for (const c of g.cells) {
    if (!c.b || !ids.includes(c.b.id)) continue;
    const d = DEFS[c.b.id];
    const eco = ECO[c.b.id];
    const base = eco.serviceCapacity ?? 20;
    const cap = Math.floor(base * (0.85 + c.b.level * 0.15));
    const r = (d.radius ?? 3) + c.b.level - 1;
    out.push({ x: c.x, y: c.y, cap, r });
  }
  return out;
}

export function serviceQualityAt(
  g: Game,
  x: number,
  y: number,
  ids: BuildId[],
): { covered: boolean; quality: number; load: number } {
  const providers = serviceProviders(g, ids);
  let best = 0;
  let coveredFlag = false;
  let load = 0;
  for (const p of providers) {
    if (!inRadius(x, y, p.x, p.y, p.r)) continue;
    coveredFlag = true;
    let demand = 0;
    for (const c of g.cells) {
      if (c.b?.id !== 'house') continue;
      if (inRadius(c.x, c.y, p.x, p.y, p.r)) {
        const tier = HOUSE[Math.min(c.b.level, HOUSE.length) - 1];
        demand += tier.pop;
      }
    }
    const q = p.cap <= 0 ? 0 : Math.min(1.25, p.cap / Math.max(1, demand));
    load = Math.max(load, Math.round((demand / Math.max(1, p.cap)) * 100));
    best = Math.max(best, Math.min(1, q));
  }
  return { covered: coveredFlag, quality: coveredFlag ? best : 0, load };
}

export function landValueAt(g: Game, x: number, y: number): number {
  const c = cell(g, x, y);
  if (!c || c.terrain === 'void') return 0;
  let v = 42;
  if (c.terrain === 'water') v += 8;
  if (roadNext(g, x, y)) v += 6;
  else v -= 10;

  const pwr = serviceQualityAt(g, x, y, ['power', 'solar']);
  const wat = serviceQualityAt(g, x, y, ['water']);
  if (pwr.covered) v += 8 * pwr.quality;
  else v -= 14;
  if (wat.covered) v += 8 * wat.quality;
  else v -= 14;
  if (covered(g, x, y, ['park'])) v += 10;
  v += 6 * serviceQualityAt(g, x, y, ['school', 'uni']).quality;
  v += 5 * serviceQualityAt(g, x, y, ['hospital']).quality;
  v += 4 * serviceQualityAt(g, x, y, ['police']).quality;

  for (const o of g.cells) {
    if (!o.b) continue;
    const dist = Math.max(Math.abs(o.x - x), Math.abs(o.y - y));
    if (dist > 3) continue;
    const pol = ECO[o.b.id].pollution;
    if (pol > 0) v -= pol * (4 - dist) * 0.8;
  }

  if (g.disasterUntil && Date.now() < g.disasterUntil) v -= 12;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function happinessAt(
  g: Game,
  x: number,
  y: number,
): { sat: number; causes: HappinessCause[] } {
  const causes: HappinessCause[] = [];
  let s = 50;
  const bump = (label: string, delta: number) => {
    if (!delta) return;
    causes.push({ label, delta });
    s += delta;
  };

  if (!roadNext(g, x, y)) bump('Kein Straßenanschluss', -28);
  else bump('Straßenanschluss', 4);

  const pwr = serviceQualityAt(g, x, y, ['power', 'solar']);
  if (!pwr.covered) bump('Kein Strom', -18);
  else if (pwr.quality < 0.7) bump('Strom überlastet', -8);
  else bump('Stromversorgung', 8);

  const wat = serviceQualityAt(g, x, y, ['water']);
  if (!wat.covered) bump('Kein Wasser', -18);
  else if (wat.quality < 0.7) bump('Wasser überlastet', -6);
  else bump('Wasserversorgung', 8);

  const sew = serviceQualityAt(g, x, y, ['sewage']);
  if (!sew.covered) bump('Kein Abwasser', -5);
  else bump('Abwasser', Math.round(5 * sew.quality));

  const waste = serviceQualityAt(g, x, y, ['waste']);
  if (!waste.covered) bump('Müllproblem', -5);
  else bump('Müllentsorgung', Math.round(5 * waste.quality));

  const health = serviceQualityAt(g, x, y, ['hospital']);
  if (!health.covered) bump('Keine Klinik', -4);
  else if (health.quality < 0.75) bump('Klinik überlastet', -6);
  else bump('Gesundheitsversorgung', Math.round(7 * health.quality));

  const safety = serviceQualityAt(g, x, y, ['police']);
  if (!safety.covered) bump('Unsicher', -3);
  else bump('Sicherheit', Math.round(5 * safety.quality));

  const fire = serviceQualityAt(g, x, y, ['fire']);
  if (!fire.covered) bump('Keine Feuerwehr', -2);
  else bump('Feuerwehr', Math.round(3 * fire.quality));

  if (covered(g, x, y, ['park'])) bump('Parknähe', 9);
  const edu = serviceQualityAt(g, x, y, ['school', 'uni']);
  if (edu.covered) bump('Bildung', Math.round(5 * edu.quality));
  if (covered(g, x, y, ['cinema', 'stadium'])) bump('Freizeit', 6);

  const lv = landValueAt(g, x, y);
  if (lv >= 70) bump('Hoher Grundstückswert', 6);
  else if (lv < 35) bump('Niedriger Grundstückswert', -5);

  if (g.disasterUntil && Date.now() < g.disasterUntil) bump('Katastrophe', -22);
  if (g.region === 'snow') bump('Klima', -3);
  if (g.region === 'desert' && !wat.covered) bump('Wüste ohne Wasser', -5);

  s = Math.max(0, Math.min(100, Math.round(s)));
  causes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return { sat: s, causes: causes.slice(0, 6) };
}

export function computeCitySim(g: Game): CitySim {
  let pop = 0;
  let housing = 0;
  let houses = 0;
  let jobs = 0;
  let maintenance = 0;
  let commerce = 0;
  let industry = 0;
  let landSum = 0;
  let landN = 0;
  let satSum = 0;
  const causeAcc = new Map<string, number>();

  for (const c of g.cells) {
    if (c.terrain !== 'void') {
      landSum += landValueAt(g, c.x, c.y);
      landN++;
    }
    if (!c.b) continue;
    const eco = ECO[c.b.id];
    const lvl = c.b.level;
    maintenance += eco.maintenance * (0.9 + lvl * 0.1);
    jobs += Math.floor(eco.jobs * (0.85 + lvl * 0.15));
    if (eco.commerce) commerce += eco.commerce * lvl;

    if (c.b.id === 'house') {
      houses++;
      const tier = HOUSE[Math.min(lvl, HOUSE.length) - 1];
      housing += tier.pop;
      pop += tier.pop;
      const { sat, causes } = happinessAt(g, c.x, c.y);
      satSum += sat;
      for (const cause of causes) {
        causeAcc.set(cause.label, (causeAcc.get(cause.label) || 0) + cause.delta);
      }
    } else if (eco.jobs > 0 && (DEFS[c.b.id].cat === 'raw' || DEFS[c.b.id].cat === 'craft')) {
      industry += Math.floor(1.5 * lvl * Math.max(1, eco.jobs * 0.15));
    }
  }

  let taxes = 0;
  for (const c of g.cells) {
    if (c.b?.id !== 'house') continue;
    const tier = HOUSE[Math.min(c.b.level, HOUSE.length) - 1];
    const { sat } = happinessAt(g, c.x, c.y);
    const lv = landValueAt(g, c.x, c.y);
    let mult = (sat / 100) * (0.8 + lv / 160);
    if (covered(g, c.x, c.y, ['school'])) mult *= 1.08;
    if (covered(g, c.x, c.y, ['uni'])) mult *= 1.12;
    if (covered(g, c.x, c.y, ['stadium', 'cinema'])) mult *= 1.05;
    taxes += Math.floor(tier.tax * mult);
  }

  const employed = Math.min(pop, jobs);
  const unemployment = pop <= 0 ? 0 : Math.round(((pop - employed) / Math.max(1, pop)) * 100);

  let sat = houses ? Math.round(satSum / houses) : 0;
  if (unemployment > 25) {
    const pen = Math.min(15, Math.floor((unemployment - 25) / 5));
    sat = Math.max(0, sat - pen);
    causeAcc.set('Arbeitslosigkeit', -pen);
  } else if (jobs > pop && pop > 0) {
    causeAcc.set('Gute Joblage', 4);
    sat = Math.min(100, sat + 4);
  }

  const jobGap = jobs - pop;
  const demand: DemandSnap = {
    residential: Math.max(-100, Math.min(100, Math.round(jobGap * 2 + (housing < jobs ? 20 : -10)))),
    commercial: Math.max(-100, Math.min(100, Math.round(pop * 0.15 - commerce * 3))),
    industrial: Math.max(
      -100,
      Math.min(100, Math.round(unemployment > 20 ? 30 + unemployment * 0.5 : jobGap < -10 ? -20 : 5)),
    ),
  };

  const services: ServiceSnap[] = SERVICE_MAP.map((svc) => {
    const providers = serviceProviders(g, svc.ids);
    const capacity = providers.reduce((a, p) => a + p.cap, 0);
    const demandPop =
      svc.kind === 'power' || svc.kind === 'water' || svc.kind === 'sewage' || svc.kind === 'waste'
        ? pop
        : Math.floor(pop * 0.85);
    const load = capacity <= 0 ? (pop > 0 ? 999 : 0) : Math.round((demandPop / capacity) * 100);
    const quality = capacity <= 0 ? 0 : Math.min(1, capacity / Math.max(1, demandPop));
    return { kind: svc.kind, label: svc.label, capacity, demand: demandPop, load, quality };
  });

  const serviceMaint = Math.floor(
    services.reduce((a, s) => a + (s.capacity > 0 ? s.capacity * 0.02 : 0), 0),
  );
  const maintTotal = Math.floor(maintenance) + serviceMaint;
  const cashflow: CashflowSnap = {
    taxes,
    commerce: Math.floor(commerce),
    industry: Math.floor(industry),
    maintenance: Math.floor(maintenance),
    services: serviceMaint,
    net: taxes + Math.floor(commerce) + Math.floor(industry) - maintTotal,
  };

  ensureProgression(g);
  const mod = specModifiers(g);
  cashflow.taxes = Math.floor(cashflow.taxes * mod.taxMult);
  cashflow.commerce = Math.floor(cashflow.commerce * mod.commerceMult);
  cashflow.net =
    cashflow.taxes + cashflow.commerce + cashflow.industry - cashflow.maintenance - cashflow.services;
  sat = Math.max(0, Math.min(100, sat + mod.happiness));
  if (mod.happiness) causeAcc.set('Spezialisierung', mod.happiness);

  if (g.traffic && g.traffic.congestion > 50) {
    const pen = Math.min(12, Math.floor((g.traffic.congestion - 50) / 5));
    sat = Math.max(0, sat - pen);
    causeAcc.set('Stau', -pen);
  }

  const causes: HappinessCause[] = [...causeAcc.entries()]
    .map(([label, delta]) => ({ label, delta: Math.round(delta / Math.max(1, houses)) }))
    .filter((c) => c.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 6);

  return {
    pop,
    housing,
    houses,
    jobs,
    employed,
    unemployment,
    sat,
    causes,
    demand,
    services,
    landAvg: landN ? Math.round(landSum / landN) : 0,
    cashflow,
    taxMs: 18_000,
  };
}

export function refreshSim(g: Game): CitySim {
  const sim = computeCitySim(g);
  g.sim = sim;
  g.lastSimAt = Date.now();
  return sim;
}

export function getSim(g: Game): CitySim {
  if (g.sim && g.lastSimAt && Date.now() - g.lastSimAt < 1500) return g.sim;
  return refreshSim(g);
}

export function canUpgradeHouseSoft(g: Game, x: number, y: number): string | null {
  const lv = landValueAt(g, x, y);
  if (lv < 28) return `Grundstückswert zu niedrig (${lv}/28).`;
  const pwr = serviceQualityAt(g, x, y, ['power', 'solar']);
  const wat = serviceQualityAt(g, x, y, ['water']);
  if (!pwr.covered || pwr.quality < 0.5) return 'Stromversorgung unzureichend.';
  if (!wat.covered || wat.quality < 0.5) return 'Wasserversorgung unzureichend.';
  return null;
}

export function landColor(v: number): string {
  if (v < 30) return `rgba(80,120,200,${0.25 + v / 120})`;
  if (v < 55) return `rgba(60,180,120,${0.22 + v / 200})`;
  return `rgba(240,200,80,${0.2 + v / 180})`;
}
