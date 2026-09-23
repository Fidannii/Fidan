/**
 * Phase 5 — persistent city states per region + simple regional trade.
 */

import type { Game, RegionId, Res } from './types';
import { createGame } from './world';
import { REGIONS, RES } from './catalog';

/** Snapshot of a city's map + local economy (shared meta stays on Game root) */
export interface CityState {
  region: RegionId;
  cells: Game['cells'];
  size: number;
  unlock: number;
  built: number;
  disasterUntil: number | null;
  offers: Game['offers'];
  lastOfferAt: number;
  quests: Game['quests'];
  specialization: Game['specialization'];
  cityTier: Game['cityTier'];
  localCash: number;
  localInv: Record<Res, number>;
}

function snapshotCity(g: Game): CityState {
  return {
    region: g.region,
    cells: structuredClone(g.cells),
    size: g.size,
    unlock: g.unlock,
    built: g.built,
    disasterUntil: g.disasterUntil,
    offers: structuredClone(g.offers),
    lastOfferAt: g.lastOfferAt,
    quests: structuredClone(g.quests),
    specialization: g.specialization ?? 'none',
    cityTier: g.cityTier ?? 'dorf',
    localCash: Math.floor(g.cash * 0.15), // reserved regional purse
    localInv: { ...g.inv },
  };
}

function applyCity(g: Game, st: CityState) {
  g.region = st.region;
  g.cells = st.cells;
  g.size = st.size;
  g.unlock = st.unlock;
  g.built = st.built;
  g.disasterUntil = st.disasterUntil;
  g.offers = st.offers;
  g.lastOfferAt = st.lastOfferAt;
  g.quests = st.quests;
  g.specialization = st.specialization;
  g.cityTier = st.cityTier;
  g.sim = undefined;
  g.lastSimAt = undefined;
  g.traffic = undefined;
}

export function ensureCities(g: Game) {
  if (!g.cities) g.cities = {};
  if (!g.cities[g.region]) {
    g.cities[g.region] = snapshotCity(g);
  }
}

/** Switch region while persisting each city's map independently */
export function switchCity(g: Game, id: RegionId, say: (m: string) => void): Game | null {
  if (!g.unlockedRegions.includes(id)) {
    say('Region gesperrt.');
    return null;
  }
  if (id === g.region) {
    say('Bereits hier.');
    return null;
  }
  ensureCities(g);
  g.cities![g.region] = snapshotCity(g);

  const existing = g.cities![id];
  if (existing) {
    applyCity(g, existing);
    // Shared meta currencies stay
    say(`Willkommen in ${REGIONS[id].name} (gespeicherte Stadt).`);
    return g;
  }

  // New city in region — fresh map, keep player meta
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
  next.pendingLevelUps = g.pendingLevelUps;
  next.achievements = g.achievements;
  next.dailyStreak = g.dailyStreak;
  next.lastDailyAt = g.lastDailyAt;
  next.tutorialStep = g.tutorialStep;
  next.mastery = g.mastery;
  next.saveVersion = g.saveVersion;
  next.iapReceipts = { ...g.iapReceipts };
  next.cities = g.cities;
  next.specialization = 'none';
  next.cityTier = 'dorf';
  next.cities![id] = snapshotCity(next);
  say(`Neue Stadt in ${REGIONS[id].name} gegründet.`);
  return next;
}

/** Trade one resource from current city stock to another city's localInv */
export function regionalTrade(
  g: Game,
  to: RegionId,
  res: Res,
  amount: number,
  say: (m: string) => void,
): boolean {
  ensureCities(g);
  if (!g.cities![to]) {
    say('Zielstadt noch nicht besucht.');
    return false;
  }
  if (to === g.region) {
    say('Gleiche Stadt.');
    return false;
  }
  if (g.inv[res] < amount) {
    say('Zu wenig Vorrat.');
    return false;
  }
  const fee = Math.max(2, RES[res].sell * amount);
  if (g.cash < fee) {
    say(`Transport kostet ${fee}¢.`);
    return false;
  }
  g.inv[res] -= amount;
  g.cash -= fee;
  g.cities![to].localInv[res] = (g.cities![to].localInv[res] || 0) + amount;
  g.cities![g.region] = snapshotCity(g);
  say(`+${amount} ${RES[res].name} → ${REGIONS[to].name} (−${fee}¢ Transport)`);
  return true;
}
