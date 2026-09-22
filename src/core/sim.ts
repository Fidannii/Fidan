import {
  BUILD_ORDER,
  DEFS,
  HOUSE,
  REGIONS,
  RES,
  SAVE,
  SIZE,
  WEEK_MS,
} from './catalog';
import type { BuildId, Game, RegionId, Res, TradeOffer } from './types';
import {
  cell,
  city,
  covered,
  createGame,
  hasDepot,
  hasIn,
  hasStation,
  quest,
  roadNext,
  takeIn,
  xp,
} from './world';
import { TRADER_IDS, avatarMeta } from '../ui/avatars';

export type Say = (msg: string) => void;

const TRADERS = TRADER_IDS.map((id) => ({
  id,
  name: id[0].toUpperCase() + id.slice(1),
  title: avatarMeta(id).title,
}));

export function canPlace(g: Game, x: number, y: number, id: BuildId): string | null {
  const c = cell(g, x, y);
  if (!c) return 'Außerhalb.';
  if (c.terrain === 'void') return 'Gebiet gesperrt.';
  if (c.terrain === 'water') return 'Nicht auf Wasser.';
  if (c.b) return 'Feld belegt.';
  const d = DEFS[id];
  if (g.level < d.unlockLv) return `Ab Level ${d.unlockLv}.`;
  if (d.region && !g.unlockedRegions.includes(d.region) && g.region !== d.region) {
    return `Region ${REGIONS[d.region].name} nötig.`;
  }
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
  if (id === 'road' || id === 'highway') quest(g, 'roads');
  if (id === 'police' || id === 'fire') quest(g, 'services');
  g.club.warScore += 1;
  say(`${d.name} (−${d.cost})`);
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
  if (d.needsRoad && id !== 'road' && id !== 'highway' && !roadNext(g, x, y)) return false;
  if (d.power > 0 && !covered(g, x, y, ['power', 'solar'])) return false;
  if (d.water > 0 && !covered(g, x, y, ['water'])) return false;
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
    const need = d.produce.ms * (1 + b.wear / 100) * (g.region === 'snow' && d.power > 0 ? 1.15 : 1);
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
  let amt = b.ready;
  if (g.region === 'desert' && d.produce.out === 'metal') amt += 1;
  if (g.region === 'coast' && d.produce.out === 'glass') amt += 1;
  g.inv[d.produce.out] += amt;
  g.stats.collected += amt;
  if (d.produce.out === 'wood') quest(g, 'wood', amt);
  if (d.produce.out === 'planks') quest(g, 'planks', amt);
  say(`+${amt} ${RES[d.produce.out].name}`);
  b.ready = 0;
  if (hasIn(g, d.produce.in)) {
    takeIn(g, d.produce.in);
    b.jobAt = Date.now();
  } else {
    b.jobAt = d.produce.in ? null : Date.now();
  }
  xp(g, 4);
  g.club.warScore += 1;
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
  if (next.needSchool && !covered(g, x, y, ['school', 'uni'])) {
    say('Schule/Uni in der Nähe nötig.');
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
  g.stats.upgrades += 1;
  quest(g, 'upgrade');
  xp(g, 22);
  say(`→ ${next.name}`);
  return true;
}

export function upgradeService(g: Game, x: number, y: number, say: Say): boolean {
  const c = cell(g, x, y);
  if (!c?.b) return false;
  const d = DEFS[c.b.id];
  if (!d.radius || c.b.id === 'house') {
    say('Nicht ausbaubar.');
    return false;
  }
  if (c.b.level >= 3) {
    say('Max-Ausbau.');
    return false;
  }
  const cost = Math.floor(d.cost * 0.8 * c.b.level);
  if (g.cash < cost) {
    say(`Kostet ${cost}.`);
    return false;
  }
  g.cash -= cost;
  c.b.level += 1;
  say(`${d.name} Ausbau L${c.b.level} (−${cost})`);
  xp(g, 12);
  return true;
}

export function taxes(g: Game, say: Say, now = Date.now()) {
  const { tax, taxMs, sat } = city(g);
  if (now - g.lastTax < taxMs) return;
  g.lastTax = now;
  if (tax <= 0) return;
  g.cash += tax;
  say(`Steuern +${tax} (${sat}%)`);
}

export function expand(g: Game, say: Say): boolean {
  const useToken = g.tokens >= 1;
  const useKey = !useToken && g.keys.bronze >= 1;
  const cashCost = 100 + g.unlock * 25;
  if (!useToken && !useKey && g.cash < cashCost) {
    say(`Token, Bronzeschlüssel oder ${cashCost}¢.`);
    return false;
  }
  if (useToken) g.tokens -= 1;
  else if (useKey) g.keys.bronze -= 1;
  else g.cash -= cashCost;

  g.unlock += 2;
  const cx = Math.floor(g.size / 2);
  const cy = Math.floor(g.size / 2);
  const base = REGIONS[g.region].terrain;
  let n = 0;
  for (const c of g.cells) {
    if (c.terrain !== 'void') continue;
    if (Math.max(Math.abs(c.x - cx), Math.abs(c.y - cy)) <= g.unlock) {
      c.terrain = base;
      n++;
    }
  }
  quest(g, 'expand');
  xp(g, 30);
  say(`+${n} Felder`);
  return true;
}

export function speedUp(g: Game, x: number, y: number, say: Say): boolean {
  const c = cell(g, x, y);
  const b = c?.b;
  const d = b ? DEFS[b.id] : null;
  if (!b || !d?.produce || b.jobAt == null) {
    say('Keine Produktion.');
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
  let price = RES[r].sell * 4;
  if (hasStation(g)) price = Math.floor(price * 0.9);
  if (g.region === 'coast') price = Math.floor(price * 0.95);
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
  let gain = RES[r].sell;
  if (hasStation(g)) gain = Math.floor(gain * 1.1);
  g.inv[r] -= 1;
  g.cash += gain;
  say(`Verkauf ${RES[r].name} (+${gain})`);
}

export function refreshOffers(g: Game, now = Date.now()) {
  const interval = hasDepot(g) ? 25_000 : 45_000;
  if (now - g.lastOfferAt < interval && g.offers.length) return;
  g.lastOfferAt = now;
  const keys = Object.keys(RES) as Res[];
  const list: TradeOffer[] = [];
  const count = hasDepot(g) ? 5 : 3;
  for (let i = 0; i < count; i++) {
    const res = keys[Math.floor(Math.random() * keys.length)];
    const amount = 1 + Math.floor(Math.random() * 3);
    const price = Math.max(1, RES[res].sell * amount + Math.floor(Math.random() * 6) - 2);
    const trader = TRADERS[Math.floor(Math.random() * TRADERS.length)];
    list.push({
      id: `o${now}-${i}`,
      res,
      amount,
      price,
      from: trader.name,
      avatar: trader.id,
      expires: now + 90_000,
    });
  }
  g.offers = list;
}

export function acceptOffer(g: Game, id: string, say: Say) {
  const o = g.offers.find((x) => x.id === id);
  if (!o) return;
  if (Date.now() > o.expires) {
    say('Angebot abgelaufen.');
    g.offers = g.offers.filter((x) => x.id !== id);
    return;
  }
  if (g.cash < o.price) {
    say('Zu wenig Credits.');
    return;
  }
  g.cash -= o.price;
  g.inv[o.res] += o.amount;
  g.offers = g.offers.filter((x) => x.id !== id);
  say(`${o.from}: +${o.amount} ${RES[o.res].name}`);
  g.club.warScore += 2;
}

export function triggerDisaster(g: Game, say: Say): boolean {
  if (g.disasterUntil && Date.now() < g.disasterUntil) {
    say('Läuft bereits.');
    return false;
  }
  g.disasterUntil = Date.now() + 40_000;
  g.stats.disasters += 1;
  for (const c of g.cells) {
    if (c.b && Math.random() < 0.3) c.b.wear = Math.min(100, c.b.wear + 50);
  }
  say('🌪️ Katastrophe! Repariere Versorgung.');
  return true;
}

export function resolveDisaster(g: Game, say: Say) {
  if (!g.disasterUntil || Date.now() < g.disasterUntil) return;
  g.disasterUntil = null;
  g.keys.gold += 1;
  g.gems += 2;
  g.cash += 150;
  g.tokens += 1;
  say('Vorbei! +Goldschlüssel +2 Gems +Token');
}

export function tickWeek(g: Game, say: Say, now = Date.now()) {
  if (now < g.weekEnds) return;
  // AI rivals gain score
  for (const m of g.club.members) {
    if (m.ai) m.score += 20 + Math.floor(Math.random() * 40);
  }
  const rivals = [g.weekScore, 80, 120, 60, 150, 95].sort((a, b) => b - a);
  g.mayorRank = rivals.indexOf(g.weekScore) + 1;
  let reward = 40;
  let key: 'bronze' | 'silver' | 'gold' | null = 'bronze';
  if (g.mayorRank === 1) {
    reward = 200;
    key = 'gold';
  } else if (g.mayorRank === 2) {
    reward = 120;
    key = 'silver';
  } else if (g.mayorRank <= 3) {
    reward = 80;
    key = 'bronze';
  } else key = null;
  g.cash += reward;
  if (key) g.keys[key] += 1;
  say(`Bürgermeister-Wettbewerb: Platz ${g.mayorRank} (+${reward}¢)`);
  g.weekScore = 0;
  g.weekEnds = now + WEEK_MS;

  // club war resolve chunk
  for (const m of g.club.members) if (m.ai) g.club.warScore += Math.floor(Math.random() * 8);
  if (g.club.warScore >= g.club.warTarget) {
    g.cash += 250;
    g.gems += 3;
    g.keys.silver += 1;
    say('Club-Krieg gewonnen! Belohnung.');
    g.club.warScore = 0;
    g.club.warTarget += 40;
  }
}

export function unlockRegion(g: Game, id: RegionId, say: Say): boolean {
  if (g.unlockedRegions.includes(id)) {
    say('Schon freigeschaltet.');
    return false;
  }
  const cost = REGIONS[id].unlockCost;
  if (g.cash < cost) {
    say(`Kostet ${cost}.`);
    return false;
  }
  if (id !== 'valley' && g.level < 3) {
    say('Ab Level 3.');
    return false;
  }
  g.cash -= cost;
  g.unlockedRegions.push(id);
  say(`${REGIONS[id].name} freigeschaltet.`);
  return true;
}

export function switchRegion(g: Game, id: RegionId, say: Say): Game | null {
  if (!g.unlockedRegions.includes(id)) {
    say('Region gesperrt.');
    return null;
  }
  if (id === g.region) {
    say('Bereits hier.');
    return null;
  }
  // Persist currencies into a fresh map for that region (demo: carry inventory/cash)
  const next = createGame(id);
  next.cash = g.cash;
  next.gems = g.gems;
  next.keys = { ...g.keys };
  next.tokens = g.tokens;
  next.inv = { ...g.inv };
  next.level = g.level;
  next.xp = g.xp;
  next.unlockedRegions = [...g.unlockedRegions];
  next.club = g.club;
  next.weekScore = g.weekScore;
  next.weekEnds = g.weekEnds;
  next.mayorRank = g.mayorRank;
  next.stats = g.stats;
  say(`Region: ${REGIONS[id].name}`);
  return next;
}

export function tick(g: Game, say: Say) {
  const now = Date.now();
  tickProd(g, now);
  taxes(g, say, now);
  resolveDisaster(g, say);
  tickWeek(g, say, now);
  refreshOffers(g, now);
  g.offers = g.offers.filter((o) => o.expires > now);
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
    if (!g.cells?.length || g.size !== SIZE || !g.inv || !g.club) return createGame();
    g.selected = null;
    g.focus = null;
    // migrate avatars
    const defaults = ['player', 'lina', 'omar', 'mira'];
    g.club.members = g.club.members.map((m, i) => ({
      ...m,
      avatar: m.avatar || defaults[i] || 'player',
    }));
    g.offers = (g.offers || []).map((o) => ({
      ...o,
      avatar: o.avatar || 'alex',
    }));
    return g;
  } catch {
    return createGame();
  }
}

export function reset(): Game {
  localStorage.removeItem(SAVE);
  localStorage.removeItem('metrobuilder-core-intro');
  localStorage.removeItem('metrobuilder-full-intro');
  return createGame();
}

export {
  BUILD_ORDER,
  DEFS,
  HOUSE,
  RES,
  REGIONS,
  createGame,
  city,
  cell,
  roadNext,
  covered,
};
