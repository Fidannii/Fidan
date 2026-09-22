import { DEFS, HOUSE, SIZE, START_R, TAX_MS } from './catalog';
import type { BuildId, Cell, Game, Res } from './types';

export function idx(x: number, y: number, size = SIZE): number {
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

export function roadNext(g: Game, x: number, y: number): boolean {
  return neigh(x, y).some(([nx, ny]) => cell(g, nx, ny)?.b?.id === 'road');
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

export function covered(g: Game, x: number, y: number, kind: BuildId): boolean {
  const r = DEFS[kind].radius ?? 0;
  for (const c of g.cells) {
    if (c.b?.id === kind && dist(c.x, c.y, x, y) <= r) return true;
  }
  return false;
}

export function createGame(): Game {
  const size = SIZE;
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2);
  const cells: Cell[] = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = dist(x, y, cx, cy);
      let terrain: Cell['terrain'] = d <= START_R ? 'grass' : 'void';
      if (terrain === 'grass' && x === cx - 4 && y >= cy - 1 && y <= cy + 1) {
        terrain = 'water';
      }
      cells.push({ x, y, terrain, b: null });
    }
  }

  const put = (x: number, y: number, id: BuildId, level = 1) => {
    const c = cells[idx(x, y, size)];
    c.terrain = 'grass';
    c.b = {
      id,
      level,
      jobAt: DEFS[id].produce ? Date.now() : null,
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
    cash: 320,
    gems: 3,
    inv: { wood: 2, planks: 0 },
    cells,
    size,
    unlock: START_R,
    level: 1,
    xp: 0,
    lastTax: Date.now(),
    selected: null,
    focus: null,
    quests: [
      { id: 'roads', title: 'Baue 5 Straßen', cur: 0, max: 5, done: false, rewardCash: 50 },
      { id: 'wood', title: 'Sammle 8 Holz', cur: 0, max: 8, done: false, rewardCash: 60 },
      { id: 'planks', title: 'Stelle 3 Bretter her', cur: 0, max: 3, done: false, rewardCash: 80 },
      { id: 'upgrade', title: 'Upgrade 1 Haus', cur: 0, max: 1, done: false, rewardCash: 120 },
    ],
    built: 8,
  };
}

export function houseSat(g: Game, x: number, y: number): number {
  const c = cell(g, x, y);
  if (c?.b?.id !== 'house') return 0;
  let s = 50;
  if (!roadNext(g, x, y)) s -= 35;
  if (covered(g, x, y, 'power')) s += 15; else s -= 20;
  if (covered(g, x, y, 'water')) s += 15; else s -= 20;
  if (covered(g, x, y, 'park')) s += 12;
  // wear on house from under-supply already reflected; also neighbor industry clutter:
  return Math.max(0, Math.min(100, s));
}

export function city(g: Game) {
  let pop = 0;
  let houses = 0;
  let sat = 0;
  let tax = 0;
  for (const c of g.cells) {
    if (c.b?.id !== 'house') continue;
    houses++;
    const tier = HOUSE[Math.min(c.b.level, HOUSE.length) - 1];
    const hs = houseSat(g, c.x, c.y);
    sat += hs;
    pop += tier.pop;
    tax += Math.floor(tier.tax * (hs / 100));
  }
  return {
    pop,
    houses,
    sat: houses ? Math.round(sat / houses) : 0,
    tax,
    taxMs: TAX_MS,
  };
}

export function xp(g: Game, n: number) {
  g.xp += n;
  const need = g.level * 80;
  if (g.xp >= need) {
    g.xp -= need;
    g.level += 1;
  }
}

export function quest(g: Game, id: string, by = 1) {
  const q = g.quests.find((x) => x.id === id && !x.done);
  if (!q) return;
  q.cur = Math.min(q.max, q.cur + by);
  if (q.cur >= q.max) {
    q.done = true;
    g.cash += q.rewardCash;
  }
}

export function hasIn(g: Game, needs?: Partial<Record<Res, number>>): boolean {
  if (!needs) return true;
  return Object.entries(needs).every(([r, n]) => g.inv[r as Res] >= (n ?? 0));
}

export function takeIn(g: Game, needs?: Partial<Record<Res, number>>) {
  if (!needs) return;
  for (const [r, n] of Object.entries(needs)) g.inv[r as Res] -= n ?? 0;
}
