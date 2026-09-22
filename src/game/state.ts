import {
  BUILDINGS,
  HOUSE_LEVELS,
  MAP_SIZE,
  START_UNLOCK,
  type BuildingKind,
  type ResourceId,
  type Terrain,
} from './data';

export interface TileBuilding {
  kind: BuildingKind;
  level: number;
  /** Production started at (ms). null = idle / waiting for inputs */
  prodStartedAt: number | null;
  /** Stored output waiting to be collected */
  readyAmount: number;
  decay: number;
}

export interface Tile {
  x: number;
  y: number;
  terrain: Terrain;
  building: TileBuilding | null;
}

export interface QuestState {
  id: string;
  title: string;
  progress: number;
  target: number;
  rewardCredits: number;
  rewardGems: number;
  rewardToken?: 'bronze' | 'silver' | 'gold';
  done: boolean;
}

export interface GameState {
  credits: number;
  gems: number;
  keys: { bronze: number; silver: number; gold: number };
  inventory: Record<ResourceId, number>;
  tiles: Tile[];
  playerLevel: number;
  xp: number;
  selectedBuild: BuildingKind | null;
  selectedTile: { x: number; y: number } | null;
  lastTaxAt: number;
  lastTickAt: number;
  expansionTokens: number;
  unlockedRadius: number;
  quests: QuestState[];
  stats: {
    built: number;
    collected: number;
    upgrades: number;
  };
  disasterUntil: number | null;
}

function emptyInventory(): Record<ResourceId, number> {
  return {
    wood: 0,
    metal: 0,
    plastic: 0,
    glass: 0,
    planks: 0,
    tools: 0,
    furniture: 0,
    fabric: 0,
  };
}

export function createInitialState(): GameState {
  const tiles: Tile[] = [];
  const cx = Math.floor(MAP_SIZE / 2);
  const cy = Math.floor(MAP_SIZE / 2);

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const dist = Math.max(Math.abs(x - cx), Math.abs(y - cy));
      let terrain: Terrain = dist <= START_UNLOCK / 2 ? 'grass' : 'locked';
      if (terrain === 'grass' && ((x + y) % 17 === 0 || (x * y) % 23 === 0)) {
        terrain = 'dirt';
      }
      if (x === 2 && y > 4 && y < 10) terrain = terrain === 'locked' ? 'locked' : 'water';
      tiles.push({ x, y, terrain, building: null });
    }
  }

  // Starter plaza: road cross + house + woodmill + sawmill + power + water
  const place = (x: number, y: number, kind: BuildingKind, level = 1) => {
    const t = tiles[y * MAP_SIZE + x];
    if (!t || t.terrain === 'locked') return;
    t.terrain = 'grass';
    t.building = {
      kind,
      level,
      prodStartedAt: BUILDINGS[kind].produce ? Date.now() : null,
      readyAmount: 0,
      decay: 0,
    };
  };

  for (let i = cx - 2; i <= cx + 2; i++) place(i, cy, 'road');
  for (let i = cy - 2; i <= cy + 2; i++) place(cx, i, 'road');
  place(cx - 1, cy - 1, 'house');
  place(cx + 1, cy - 1, 'woodmill');
  place(cx + 1, cy + 1, 'sawmill');
  place(cx - 1, cy + 1, 'power');
  place(cx - 2, cy + 1, 'water');
  place(cx + 2, cy - 1, 'park');

  return {
    credits: 400,
    gems: 5,
    keys: { bronze: 0, silver: 0, gold: 0 },
    inventory: { ...emptyInventory(), wood: 2 },
    tiles,
    playerLevel: 1,
    xp: 0,
    selectedBuild: null,
    selectedTile: null,
    lastTaxAt: Date.now(),
    lastTickAt: Date.now(),
    expansionTokens: 0,
    unlockedRadius: START_UNLOCK / 2,
    quests: [
      {
        id: 'q1',
        title: 'Baue 3 Straßen',
        progress: 0,
        target: 3,
        rewardCredits: 60,
        rewardGems: 1,
        done: false,
      },
      {
        id: 'q2',
        title: 'Sammle 10 Holz',
        progress: 0,
        target: 10,
        rewardCredits: 80,
        rewardGems: 1,
        rewardToken: 'bronze',
        done: false,
      },
      {
        id: 'q3',
        title: 'Upgrade 1 Wohnhaus',
        progress: 0,
        target: 1,
        rewardCredits: 150,
        rewardGems: 2,
        done: false,
      },
      {
        id: 'q4',
        title: 'Erweitere die Stadt',
        progress: 0,
        target: 1,
        rewardCredits: 200,
        rewardGems: 3,
        rewardToken: 'silver',
        done: false,
      },
    ],
    stats: { built: 6, collected: 0, upgrades: 0 },
    disasterUntil: null,
  };
}

export function tileAt(state: GameState, x: number, y: number): Tile | null {
  if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return null;
  return state.tiles[y * MAP_SIZE + x];
}

export function neighbors4(x: number, y: number): Array<[number, number]> {
  return [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ];
}

export function hasRoadAccess(state: GameState, x: number, y: number): boolean {
  return neighbors4(x, y).some(([nx, ny]) => {
    const t = tileAt(state, nx, ny);
    return t?.building?.kind === 'road';
  });
}

export function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

export function coverageOf(
  state: GameState,
  x: number, y: number,
  kinds: BuildingKind[],
): boolean {
  for (const t of state.tiles) {
    if (!t.building || !kinds.includes(t.building.kind)) continue;
    const r = BUILDINGS[t.building.kind].radius ?? 0;
    if (chebyshev(t.x, t.y, x, y) <= r) return true;
  }
  return false;
}

export function houseSatisfaction(state: GameState, x: number, y: number): number {
  const tile = tileAt(state, x, y);
  if (!tile?.building || tile.building.kind !== 'house') return 0;

  let s = 55;
  const powered = coverageOf(state, x, y, ['power']);
  const watered = coverageOf(state, x, y, ['water']);
  const sewage = coverageOf(state, x, y, ['sewage']);
  const waste = coverageOf(state, x, y, ['waste']);
  const police = coverageOf(state, x, y, ['police']);
  const fire = coverageOf(state, x, y, ['fire']);
  const hospital = coverageOf(state, x, y, ['hospital']);
  const park = coverageOf(state, x, y, ['park']);
  const school = coverageOf(state, x, y, ['school']);
  const road = hasRoadAccess(state, x, y);

  if (!road) s -= 40;
  if (powered) s += 12; else s -= 25;
  if (watered) s += 12; else s -= 25;
  if (sewage) s += 8; else s -= 6;
  if (waste) s += 8; else s -= 6;
  if (police) s += 6; else s -= 4;
  if (fire) s += 6; else s -= 4;
  if (hospital) s += 8;
  if (park) s += 10;
  if (school) s += 6;
  if (state.disasterUntil && Date.now() < state.disasterUntil) s -= 30;

  // Landmark global bonus applied later
  return Math.max(0, Math.min(100, s));
}

export function hasLandmark(state: GameState): boolean {
  return state.tiles.some((t) => t.building?.kind === 'landmark');
}

export function cityStats(state: GameState) {
  let pop = 0;
  let houses = 0;
  let satSum = 0;
  let taxPerCycle = 0;

  for (const t of state.tiles) {
    if (t.building?.kind !== 'house') continue;
    houses++;
    const lvl = HOUSE_LEVELS[Math.min(t.building.level, HOUSE_LEVELS.length) - 1];
    let sat = houseSatisfaction(state, t.x, t.y);
    if (hasLandmark(state)) sat = Math.min(100, sat + 8);
    satSum += sat;
    pop += lvl.pop;
    const factor = sat / 100;
    const schoolBonus = coverageOf(state, t.x, t.y, ['school']) ? 1.15 : 1;
    taxPerCycle += Math.floor(lvl.tax * factor * schoolBonus);
  }

  const satisfaction = houses ? Math.round(satSum / houses) : 0;
  return { pop, houses, satisfaction, taxPerCycle };
}

export function addXp(state: GameState, amount: number) {
  state.xp += amount;
  const need = state.playerLevel * 100;
  if (state.xp >= need) {
    state.xp -= need;
    state.playerLevel += 1;
  }
}

export function bumpQuest(state: GameState, id: string, by = 1) {
  const q = state.quests.find((x) => x.id === id && !x.done);
  if (!q) return;
  q.progress = Math.min(q.target, q.progress + by);
  if (q.progress >= q.target) {
    q.done = true;
    state.credits += q.rewardCredits;
    state.gems += q.rewardGems;
    if (q.rewardToken) state.keys[q.rewardToken] += 1;
    if (id === 'q2') state.expansionTokens += 1;
  }
}
