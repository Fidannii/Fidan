import { DEFS, HOUSE, REGIONS, SIZE, START_R, TAX_MS, WEEK_MS, emptyInv } from './catalog';
import type { BuildId, Cell, Game, RegionId, Res } from './types';

export function idx(x: number, y: number, size = SIZE) {
  return y * size + x;
}

export function cell(g: Game, x: number, y: number): Cell | null {
  if (x < 0 || y < 0 || x >= g.size || y >= g.size) return null;
  return g.cells[idx(x, y, g.size)];
}

export function neigh(x: number, y: number): Array<[number, number]> {
  return [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ];
}

export function isRoad(id: BuildId | undefined): boolean {
  return id === 'road' || id === 'highway';
}

export function roadNext(g: Game, x: number, y: number): boolean {
  return neigh(x, y).some(([nx, ny]) => isRoad(cell(g, nx, ny)?.b?.id));
}

export function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

export function covered(g: Game, x: number, y: number, kinds: BuildId[]): boolean {
  for (const c of g.cells) {
    if (!c.b || !kinds.includes(c.b.id)) continue;
    const r = (DEFS[c.b.id].radius ?? 0) + (c.b.level - 1);
    if (dist(c.x, c.y, x, y) <= r) return true;
  }
  return false;
}

export function hasLandmark(g: Game) {
  return g.cells.some((c) => c.b?.id === 'landmark');
}

export function hasDepot(g: Game) {
  return g.cells.some((c) => c.b?.id === 'depot');
}

export function hasStation(g: Game) {
  return g.cells.some((c) => c.b?.id === 'station' || c.b?.id === 'airport');
}

function baseTerrain(region: RegionId): Cell['terrain'] {
  return REGIONS[region].terrain;
}

export function createGame(region: RegionId = 'valley'): Game {
  const size = SIZE;
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2);
  const cells: Cell[] = [];
  const base = baseTerrain(region);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = dist(x, y, cx, cy);
      let terrain: Cell['terrain'] = d <= START_R ? base : 'void';
      if (terrain !== 'void' && region === 'coast' && x <= cx - 4 && d <= START_R) {
        terrain = 'water';
      }
      if (terrain !== 'void' && region === 'valley' && x === cx - 4 && y >= cy - 1 && y <= cy + 1) {
        terrain = 'water';
      }
      cells.push({ x, y, terrain, b: null });
    }
  }

  const put = (x: number, y: number, id: BuildId) => {
    const c = cells[idx(x, y, size)];
    c.terrain = base;
    c.b = {
      id,
      level: 1,
      jobAt: DEFS[id].produce ? 0 : null,
      ready: 0,
      wear: 0,
    };
  };

  for (let i = cx - 2; i <= cx + 2; i++) put(i, cy, 'road');
  for (let i = cy - 2; i <= cy + 2; i++) put(cx, i, 'road');
  put(cx - 1, cy - 1, 'house');
  put(cx + 1, cy - 1, 'woodcutter');
  put(cx + 1, cy + 1, 'sawmill');
  put(cx - 1, cy + 1, 'power');
  put(cx - 2, cy + 1, 'water');
  put(cx + 2, cy - 1, 'park');

  return {
    cash: 400,
    gems: 5,
    keys: { bronze: 0, silver: 0, gold: 0 },
    tokens: 0,
    inv: { ...emptyInv(), wood: 2 },
    cells,
    size,
    unlock: START_R,
    level: 1,
    xp: 0,
    lastTax: 0,
    selected: null,
    focus: null,
    quests: [
      { id: 'roads', title: 'Baue 5 Straßen', cur: 0, max: 5, done: false, rewardCash: 60, rewardGems: 1 },
      { id: 'wood', title: 'Sammle 10 Holz', cur: 0, max: 10, done: false, rewardCash: 70, rewardToken: 1 },
      { id: 'planks', title: 'Stelle 4 Bretter her', cur: 0, max: 4, done: false, rewardCash: 90, rewardKey: 'bronze' },
      { id: 'upgrade', title: 'Upgrade 1 Haus', cur: 0, max: 1, done: false, rewardCash: 140, rewardGems: 2 },
      { id: 'expand', title: 'Erweitere die Stadt', cur: 0, max: 1, done: false, rewardCash: 200, rewardKey: 'silver' },
      { id: 'services', title: 'Baue Polizei o. Feuerwehr', cur: 0, max: 1, done: false, rewardCash: 120 },
    ],
    built: 8,
    region,
    unlockedRegions: ['valley'],
    disasterUntil: null,
    weekScore: 0,
    weekEnds: WEEK_MS,
    mayorRank: 12,
    club: {
      name: 'Metro Club',
      members: [
        { name: 'Du', score: 0, ai: false, avatar: 'player' },
        { name: 'Lina', score: 40, ai: true, avatar: 'lina' },
        { name: 'Omar', score: 55, ai: true, avatar: 'omar' },
        { name: 'Mira', score: 30, ai: true, avatar: 'mira' },
      ],
      warScore: 0,
      warTarget: 100,
    },
    offers: [],
    lastOfferAt: 0,
    stats: { collected: 0, upgrades: 0, disasters: 0, dailies: 0 },
    pendingLevelUps: [],
    achievements: {},
    dailyStreak: 0,
    lastDailyAt: 0,
    tutorialStep: 0,
    mastery: 0,
    saveVersion: 8,
    specialization: 'none',
    cityTier: 'dorf',
    cities: {},
    activeEvent: null,
    nextEventAt: 90_000,
    eventPrep: 0,
    iapReceipts: {},
    seed: (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0,
    rngCount: 0,
    simTimeMs: 0,
    gameSpeed: '1x',
    taxRate: 1,
    roadsDirty: true,
    busLines: [],
    busRidership: 0,
    pendingEffects: [],
    eventCooldowns: {},
  };
}

export function houseSat(g: Game, x: number, y: number): number {
  const c = cell(g, x, y);
  if (c?.b?.id !== 'house') return 0;
  let s = 48;
  if (!roadNext(g, x, y)) s -= 35;
  if (covered(g, x, y, ['power', 'solar'])) s += 12; else s -= 22;
  if (covered(g, x, y, ['water'])) s += 12; else s -= 22;
  if (covered(g, x, y, ['sewage'])) s += 7; else s -= 5;
  if (covered(g, x, y, ['waste'])) s += 7; else s -= 5;
  if (covered(g, x, y, ['police'])) s += 6; else s -= 3;
  if (covered(g, x, y, ['fire'])) s += 6; else s -= 3;
  if (covered(g, x, y, ['hospital'])) s += 8;
  if (covered(g, x, y, ['park'])) s += 10;
  if (covered(g, x, y, ['school', 'uni'])) s += 6;
  if (covered(g, x, y, ['cinema', 'stadium'])) s += 8;
  if (g.disasterUntil && Date.now() < g.disasterUntil) s -= 28;
  if (g.region === 'snow') s -= 4;
  if (g.region === 'desert' && !covered(g, x, y, ['water'])) s -= 6;
  return Math.max(0, Math.min(100, s));
}

export function city(g: Game) {
  let pop = 0;
  let houses = 0;
  let satSum = 0;
  let tax = 0;
  const landmark = hasLandmark(g);

  for (const c of g.cells) {
    if (c.b?.id !== 'house') continue;
    houses++;
    const tier = HOUSE[Math.min(c.b.level, HOUSE.length) - 1];
    let hs = houseSat(g, c.x, c.y);
    if (landmark) hs = Math.min(100, hs + 8);
    satSum += hs;
    pop += tier.pop;
    let mult = hs / 100;
    if (covered(g, c.x, c.y, ['school'])) mult *= 1.12;
    if (covered(g, c.x, c.y, ['uni'])) mult *= 1.2;
    if (covered(g, c.x, c.y, ['stadium', 'cinema'])) mult *= 1.08;
    if (g.region === 'snow') mult *= 1.05;
    tax += Math.floor(tier.tax * mult);
  }

  return {
    pop,
    houses,
    sat: houses ? Math.round(satSum / houses) : 0,
    tax,
    taxMs: TAX_MS,
  };
}

import { gainXp } from './progression';

export function xp(g: Game, n: number) {
  const events = gainXp(g, n);
  if (events.length) g.pendingLevelUps.push(...events);
  return events;
}

export function quest(g: Game, id: string, by = 1) {
  const q = g.quests.find((x) => x.id === id && !x.done);
  if (!q) return;
  q.cur = Math.min(q.max, q.cur + by);
  if (q.cur >= q.max) {
    q.done = true;
    g.cash += q.rewardCash;
    if (q.rewardGems) g.gems += q.rewardGems;
    if (q.rewardKey) g.keys[q.rewardKey] += 1;
    if (q.rewardToken) g.tokens += q.rewardToken;
    xp(g, 20);
  }
}

export function hasIn(g: Game, needs?: Partial<Record<Res, number>>) {
  if (!needs) return true;
  return Object.entries(needs).every(([r, n]) => g.inv[r as Res] >= (n ?? 0));
}

export function takeIn(g: Game, needs?: Partial<Record<Res, number>>) {
  if (!needs) return;
  for (const [r, n] of Object.entries(needs)) g.inv[r as Res] -= n ?? 0;
}
