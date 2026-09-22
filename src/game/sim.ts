import {
  BUILDINGS,
  HOUSE_LEVELS,
  MAP_SIZE,
  RESOURCES,
  TAX_INTERVAL_MS,
  type BuildingKind,
  type ResourceId,
} from './data';
import {
  addXp,
  bumpQuest,
  cityStats,
  coverageOf,
  createInitialState,
  hasRoadAccess,
  houseSatisfaction,
  tileAt,
  type GameState,
} from './state';

export type ToastFn = (msg: string) => void;

export function canAfford(state: GameState, cost: number): boolean {
  return state.credits >= cost;
}

export function canPlace(
  state: GameState,
  x: number,
  y: number,
  kind: BuildingKind,
): string | null {
  const tile = tileAt(state, x, y);
  if (!tile) return 'Außerhalb der Karte.';
  if (tile.terrain === 'locked') return 'Gebiet gesperrt — erweitere die Stadt.';
  if (tile.terrain === 'water' && kind !== 'park') return 'Nicht auf Wasser baubar.';
  if (tile.building) return 'Feld belegt.';
  const def = BUILDINGS[kind];
  if (state.playerLevel < def.unlockLevel) {
    return `Freischaltung ab Level ${def.unlockLevel}.`;
  }
  if (!canAfford(state, def.cost)) return 'Nicht genug Credits.';
  if (def.needsRoad && !hasRoadAccess(state, x, y) && kind !== 'road') {
    return 'Straße muss angrenzen.';
  }
  return null;
}

export function placeBuilding(
  state: GameState,
  x: number,
  y: number,
  kind: BuildingKind,
  toast: ToastFn,
): boolean {
  const err = canPlace(state, x, y, kind);
  if (err) {
    toast(err);
    return false;
  }
  const tile = tileAt(state, x, y)!;
  const def = BUILDINGS[kind];
  state.credits -= def.cost;
  tile.building = {
    kind,
    level: 1,
    prodStartedAt: def.produce ? Date.now() : null,
    readyAmount: 0,
    decay: 0,
  };
  state.stats.built += 1;
  addXp(state, 8);
  if (kind === 'road') bumpQuest(state, 'q1');
  toast(`${def.name} gebaut (−${def.cost}¢)`);
  return true;
}

export function demolish(state: GameState, x: number, y: number, toast: ToastFn) {
  const tile = tileAt(state, x, y);
  if (!tile?.building) {
    toast('Nichts zum Abreißen.');
    return;
  }
  const refund = Math.floor(BUILDINGS[tile.building.kind].cost * 0.4);
  state.credits += refund;
  tile.building = null;
  toast(`Abgerissen (+${refund}¢)`);
}

function hasInputs(
  state: GameState,
  inputs?: Partial<Record<ResourceId, number>>,
): boolean {
  if (!inputs) return true;
  return Object.entries(inputs).every(
    ([r, n]) => state.inventory[r as ResourceId] >= (n ?? 0),
  );
}

function consumeInputs(
  state: GameState,
  inputs?: Partial<Record<ResourceId, number>>,
) {
  if (!inputs) return;
  for (const [r, n] of Object.entries(inputs)) {
    state.inventory[r as ResourceId] -= n ?? 0;
  }
}

export function tickProduction(state: GameState, now = Date.now()) {
  for (const tile of state.tiles) {
    const b = tile.building;
    if (!b) continue;
    const def = BUILDINGS[b.kind];
    if (!def.produce) continue;

    // Decay / under-supply slows production
    const powered =
      def.powerNeed === 0 || coverageOf(state, tile.x, tile.y, ['power']);
    const watered =
      def.waterNeed === 0 || coverageOf(state, tile.x, tile.y, ['water']);
    const roadOk = !def.needsRoad || hasRoadAccess(state, tile.x, tile.y) || b.kind === 'road';

    if (!powered || !watered || !roadOk) {
      b.decay = Math.min(100, b.decay + 0.02);
      continue;
    }
    b.decay = Math.max(0, b.decay - 0.05);

    if (b.readyAmount > 0) continue; // waiting for collect

    if (b.prodStartedAt == null) {
      if (hasInputs(state, def.produce.inputs)) {
        consumeInputs(state, def.produce.inputs);
        b.prodStartedAt = now;
      }
      continue;
    }

    const slow = 1 + b.decay / 100;
    const needMs = def.produce.seconds * 1000 * slow;
    if (now - b.prodStartedAt >= needMs) {
      b.readyAmount = def.produce.amount;
      b.prodStartedAt = null;
    }
  }
}

export function collectAt(
  state: GameState,
  x: number,
  y: number,
  toast: ToastFn,
): boolean {
  const tile = tileAt(state, x, y);
  const b = tile?.building;
  if (!b || b.readyAmount <= 0) return false;
  const def = BUILDINGS[b.kind];
  if (!def.produce) return false;
  state.inventory[def.produce.resource] += b.readyAmount;
  state.stats.collected += b.readyAmount;
  if (def.produce.resource === 'wood') bumpQuest(state, 'q2', b.readyAmount);
  toast(`+${b.readyAmount} ${RESOURCES[def.produce.resource].name}`);
  b.readyAmount = 0;
  // Restart if inputs available
  if (hasInputs(state, def.produce.inputs)) {
    consumeInputs(state, def.produce.inputs);
    b.prodStartedAt = Date.now();
  } else {
    b.prodStartedAt = def.produce.inputs ? null : Date.now();
  }
  addXp(state, 3);
  return true;
}

export function tryUpgradeHouse(
  state: GameState,
  x: number,
  y: number,
  toast: ToastFn,
): boolean {
  const tile = tileAt(state, x, y);
  if (!tile?.building || tile.building.kind !== 'house') {
    toast('Kein Wohnhaus.');
    return false;
  }
  const next = tile.building.level + 1;
  const def = HOUSE_LEVELS.find((h) => h.level === next);
  if (!def) {
    toast('Maximale Stufe erreicht.');
    return false;
  }
  // School required for level 4
  if (next >= 4 && !coverageOf(state, x, y, ['school'])) {
    toast('Schule in der Nähe nötig für Turm.');
    return false;
  }
  if (!canAfford(state, def.cost)) {
    toast('Nicht genug Credits.');
    return false;
  }
  for (const [r, n] of Object.entries(def.needs)) {
    if (state.inventory[r as ResourceId] < (n ?? 0)) {
      toast(`Fehlt: ${RESOURCES[r as ResourceId].name}`);
      return false;
    }
  }
  state.credits -= def.cost;
  for (const [r, n] of Object.entries(def.needs)) {
    state.inventory[r as ResourceId] -= n ?? 0;
  }
  tile.building.level = next;
  state.stats.upgrades += 1;
  bumpQuest(state, 'q3');
  addXp(state, 25);
  toast(`Upgrade → ${def.name}`);
  return true;
}

export function collectTaxes(state: GameState, toast: ToastFn, now = Date.now()) {
  if (now - state.lastTaxAt < TAX_INTERVAL_MS) return;
  const { taxPerCycle, satisfaction } = cityStats(state);
  state.lastTaxAt = now;
  if (taxPerCycle <= 0) return;
  state.credits += taxPerCycle;
  toast(`Steuern +${taxPerCycle}¢ (Zufriedenheit ${satisfaction}%)`);
}

export function expandCity(state: GameState, toast: ToastFn): boolean {
  if (state.expansionTokens < 1 && state.keys.bronze < 1) {
    toast('Braucht Erweiterungs-Token (Quest) oder Bronzeschlüssel.');
    return false;
  }
  if (state.expansionTokens >= 1) state.expansionTokens -= 1;
  else state.keys.bronze -= 1;

  state.unlockedRadius += 2;
  const cx = Math.floor(MAP_SIZE / 2);
  const cy = Math.floor(MAP_SIZE / 2);
  let unlocked = 0;
  for (const t of state.tiles) {
    const dist = Math.max(Math.abs(t.x - cx), Math.abs(t.y - cy));
    if (t.terrain === 'locked' && dist <= state.unlockedRadius) {
      t.terrain = (t.x + t.y) % 11 === 0 ? 'dirt' : 'grass';
      unlocked++;
    }
  }
  bumpQuest(state, 'q4');
  addXp(state, 40);
  toast(`Stadt erweitert! +${unlocked} Felder`);
  return true;
}

export function speedUp(
  state: GameState,
  x: number,
  y: number,
  toast: ToastFn,
): boolean {
  const tile = tileAt(state, x, y);
  const b = tile?.building;
  const def = b ? BUILDINGS[b.kind] : null;
  if (!b || !def?.produce || b.prodStartedAt == null) {
    toast('Keine laufende Produktion.');
    return false;
  }
  if (state.gems < 1) {
    toast('Keine Gems.');
    return false;
  }
  state.gems -= 1;
  b.readyAmount = def.produce.amount;
  b.prodStartedAt = null;
  toast('Produktion abgeschlossen (−1 Gem)');
  return true;
}

export function buyFromMarket(
  state: GameState,
  resource: ResourceId,
  toast: ToastFn,
): boolean {
  const price = RESOURCES[resource].softSell * 3;
  if (!canAfford(state, price)) {
    toast('Zu teuer.');
    return false;
  }
  state.credits -= price;
  state.inventory[resource] += 1;
  toast(`Markt: +1 ${RESOURCES[resource].name} (−${price}¢)`);
  return true;
}

export function sellToMarket(
  state: GameState,
  resource: ResourceId,
  toast: ToastFn,
): boolean {
  if (state.inventory[resource] < 1) {
    toast('Nichts zu verkaufen.');
    return false;
  }
  state.inventory[resource] -= 1;
  const gain = RESOURCES[resource].softSell;
  state.credits += gain;
  toast(`Verkauft: ${RESOURCES[resource].name} (+${gain}¢)`);
  return true;
}

export function triggerDisaster(state: GameState, toast: ToastFn): boolean {
  if (state.disasterUntil && Date.now() < state.disasterUntil) {
    toast('Katastrophe läuft bereits.');
    return false;
  }
  state.disasterUntil = Date.now() + 45_000;
  // Damage some buildings visually via decay
  for (const t of state.tiles) {
    if (t.building && Math.random() < 0.25) t.building.decay = 80;
  }
  toast('🌪️ Sturm! Repariere Versorgung — Bonus folgt.');
  return true;
}

export function resolveDisaster(state: GameState, toast: ToastFn) {
  if (!state.disasterUntil) return;
  if (Date.now() < state.disasterUntil) return;
  state.disasterUntil = null;
  state.keys.gold += 1;
  state.gems += 2;
  state.credits += 100;
  toast('Katastrophe vorbei! +1 Goldschlüssel, +2 Gems, +100¢');
}

export function tick(state: GameState, toast: ToastFn) {
  const now = Date.now();
  tickProduction(state, now);
  collectTaxes(state, toast, now);
  resolveDisaster(state, toast);
  state.lastTickAt = now;
}

export function productionProgress(state: GameState, x: number, y: number): number {
  const tile = tileAt(state, x, y);
  const b = tile?.building;
  const def = b ? BUILDINGS[b.kind] : null;
  if (!b || !def?.produce) return 0;
  if (b.readyAmount > 0) return 1;
  if (b.prodStartedAt == null) return 0;
  const slow = 1 + b.decay / 100;
  const need = def.produce.seconds * 1000 * slow;
  return Math.min(1, (Date.now() - b.prodStartedAt) / need);
}

export {
  createInitialState,
  cityStats,
  houseSatisfaction,
  tileAt,
  BUILDINGS,
  HOUSE_LEVELS,
  RESOURCES,
};
export type { GameState };
