import { BUILD_ORDER, DEFS, HOUSE, RES, SAVE, SIZE } from './catalog';
import type { BuildId, Game, Res } from './types';
import {
  cell,
  city,
  covered,
  createGame,
  hasIn,
  quest,
  roadNext,
  takeIn,
  xp,
} from './world';

export type Say = (msg: string) => void;

export function canPlace(g: Game, x: number, y: number, id: BuildId): string | null {
  const c = cell(g, x, y);
  if (!c) return 'Außerhalb.';
  if (c.terrain === 'void') return 'Gebiet gesperrt — erweitern.';
  if (c.terrain === 'water') return 'Nicht auf Wasser.';
  if (c.b) return 'Feld belegt.';
  const d = DEFS[id];
  if (g.cash < d.cost) return 'Zu wenig Credits.';
  if (d.needsRoad && !roadNext(g, x, y)) return 'Straße muss angrenzen.';
  return null;
}

export function place(g: Game, x: number, y: number, id: BuildId, say: Say): boolean {
  const err = canPlace(g, x, y, id);
  if (err) {
    say(err);
    return false;
  }
  const c = cell(g, x, y)!;
  const d = DEFS[id];
  g.cash -= d.cost;
  c.b = {
    id,
    level: 1,
    jobAt: d.produce ? Date.now() : null,
    ready: 0,
    wear: 0,
  };
  g.built += 1;
  xp(g, 6);
  if (id === 'road') quest(g, 'roads');
  say(`${d.name} gebaut (−${d.cost})`);
  return true;
}

export function demolish(g: Game, x: number, y: number, say: Say) {
  const c = cell(g, x, y);
  if (!c?.b) {
    say('Nichts da.');
    return;
  }
  const back = Math.floor(DEFS[c.b.id].cost * 0.4);
  g.cash += back;
  c.b = null;
  say(`Abgerissen (+${back})`);
}

function supplied(g: Game, x: number, y: number, id: BuildId): boolean {
  const d = DEFS[id];
  if (d.needsRoad && id !== 'road' && !roadNext(g, x, y)) return false;
  if (d.power > 0 && !covered(g, x, y, 'power')) return false;
  if (d.water > 0 && !covered(g, x, y, 'water')) return false;
  return true;
}

export function tickProd(g: Game, now = Date.now()) {
  for (const c of g.cells) {
    const b = c.b;
    if (!b) continue;
    const d = DEFS[b.id];
    if (!d.produce) continue;

    if (!supplied(g, c.x, c.y, b.id)) {
      b.wear = Math.min(100, b.wear + 0.04);
      continue;
    }
    b.wear = Math.max(0, b.wear - 0.06);

    if (b.ready > 0) continue;

    if (b.jobAt == null) {
      if (hasIn(g, d.produce.in)) {
        takeIn(g, d.produce.in);
        b.jobAt = now;
      }
      continue;
    }

    const need = d.produce.ms * (1 + b.wear / 100);
    if (now - b.jobAt >= need) {
      b.ready = d.produce.amount;
      b.jobAt = null;
    }
  }
}

export function collect(g: Game, x: number, y: number, say: Say): boolean {
  const c = cell(g, x, y);
  const b = c?.b;
  if (!b || b.ready <= 0) return false;
  const d = DEFS[b.id];
  if (!d.produce) return false;
  g.inv[d.produce.out] += b.ready;
  if (d.produce.out === 'wood') quest(g, 'wood', b.ready);
  if (d.produce.out === 'planks') quest(g, 'planks', b.ready);
  say(`+${b.ready} ${RES[d.produce.out].name}`);
  b.ready = 0;
  if (hasIn(g, d.produce.in)) {
    takeIn(g, d.produce.in);
    b.jobAt = Date.now();
  } else {
    b.jobAt = d.produce.in ? null : Date.now();
  }
  xp(g, 4);
  return true;
}

export function upgradeHouse(g: Game, x: number, y: number, say: Say): boolean {
  const c = cell(g, x, y);
  if (c?.b?.id !== 'house') {
    say('Kein Wohnhaus.');
    return false;
  }
  const next = HOUSE.find((h) => h.level === c.b!.level + 1);
  if (!next) {
    say('Max-Stufe.');
    return false;
  }
  if (g.cash < next.cost) {
    say('Zu wenig Credits.');
    return false;
  }
  if (!hasIn(g, next.needs)) {
    say('Waren fehlen.');
    return false;
  }
  g.cash -= next.cost;
  takeIn(g, next.needs);
  c.b.level = next.level;
  quest(g, 'upgrade');
  xp(g, 20);
  say(`Upgrade → ${next.name}`);
  return true;
}

export function taxes(g: Game, say: Say, now = Date.now()) {
  const { tax, taxMs, sat } = city(g);
  if (now - g.lastTax < taxMs) return;
  g.lastTax = now;
  if (tax <= 0) return;
  g.cash += tax;
  say(`Steuern +${tax} (Zufriedenheit ${sat}%)`);
}

export function expand(g: Game, say: Say): boolean {
  const cost = 80 + g.unlock * 20;
  if (g.cash < cost) {
    say(`Erweitern kostet ${cost}.`);
    return false;
  }
  g.cash -= cost;
  g.unlock += 2;
  const cx = Math.floor(g.size / 2);
  const cy = Math.floor(g.size / 2);
  let n = 0;
  for (const c of g.cells) {
    if (c.terrain !== 'void') continue;
    if (Math.max(Math.abs(c.x - cx), Math.abs(c.y - cy)) <= g.unlock) {
      c.terrain = 'grass';
      n++;
    }
  }
  xp(g, 30);
  say(`+${n} Felder (−${cost})`);
  return true;
}

export function speedUp(g: Game, x: number, y: number, say: Say): boolean {
  const c = cell(g, x, y);
  const b = c?.b;
  const d = b ? DEFS[b.id] : null;
  if (!b || !d?.produce || b.jobAt == null) {
    say('Keine laufende Produktion.');
    return false;
  }
  if (g.gems < 1) {
    say('Keine Gems.');
    return false;
  }
  g.gems -= 1;
  b.ready = d.produce.amount;
  b.jobAt = null;
  say('Fertig (−1 Gem)');
  return true;
}

export function buy(g: Game, r: Res, say: Say) {
  const price = RES[r].sell * 4;
  if (g.cash < price) {
    say('Zu teuer.');
    return;
  }
  g.cash -= price;
  g.inv[r] += 1;
  say(`+1 ${RES[r].name} (−${price})`);
}

export function sell(g: Game, r: Res, say: Say) {
  if (g.inv[r] < 1) {
    say('Nichts da.');
    return;
  }
  g.inv[r] -= 1;
  g.cash += RES[r].sell;
  say(`Verkauft ${RES[r].name} (+${RES[r].sell})`);
}

export function tick(g: Game, say: Say) {
  const now = Date.now();
  tickProd(g, now);
  taxes(g, say, now);
}

export function prog(g: Game, x: number, y: number): number {
  const c = cell(g, x, y);
  const b = c?.b;
  const d = b ? DEFS[b.id] : null;
  if (!b || !d?.produce) return 0;
  if (b.ready > 0) return 1;
  if (b.jobAt == null) return 0;
  const need = d.produce.ms * (1 + b.wear / 100);
  return Math.min(1, (Date.now() - b.jobAt) / need);
}

export function save(g: Game) {
  try {
    localStorage.setItem(SAVE, JSON.stringify(g));
  } catch {
    /* ignore */
  }
}

export function load(): Game {
  try {
    const raw = localStorage.getItem(SAVE);
    if (!raw) return createGame();
    const g = JSON.parse(raw) as Game;
    if (!g.cells?.length || g.size !== SIZE) return createGame();
    g.selected = null;
    g.focus = null;
    return g;
  } catch {
    return createGame();
  }
}

export function reset(): Game {
  localStorage.removeItem(SAVE);
  localStorage.removeItem('metrobuilder-intro');
  return createGame();
}

export { BUILD_ORDER, DEFS, HOUSE, RES, createGame, city, cell, roadNext, covered };
