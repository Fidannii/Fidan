/** MetroBuilder — Core types (Phase-1 foundation) */

export type Res = 'wood' | 'planks';

export type BuildId =
  | 'road'
  | 'house'
  | 'woodcutter'
  | 'sawmill'
  | 'power'
  | 'water'
  | 'park';

export type Terrain = 'void' | 'grass' | 'water';

export interface ProduceSpec {
  out: Res;
  amount: number;
  ms: number;
  in?: Partial<Record<Res, number>>;
}

export interface BuildDef {
  id: BuildId;
  name: string;
  cost: number;
  needsRoad: boolean;
  power: number;
  water: number;
  produce?: ProduceSpec;
  radius?: number;
  color: string;
  icon: string;
  blurb: string;
}

export interface HouseTier {
  level: number;
  name: string;
  pop: number;
  tax: number;
  cost: number;
  needs: Partial<Record<Res, number>>;
}

export interface Building {
  id: BuildId;
  level: number;
  /** epoch ms when current job started; null = idle / waiting inputs */
  jobAt: number | null;
  ready: number;
  wear: number;
}

export interface Cell {
  x: number;
  y: number;
  terrain: Terrain;
  b: Building | null;
}

export interface Quest {
  id: string;
  title: string;
  cur: number;
  max: number;
  done: boolean;
  rewardCash: number;
}

export interface Game {
  cash: number;
  gems: number;
  inv: Record<Res, number>;
  cells: Cell[];
  size: number;
  unlock: number;
  level: number;
  xp: number;
  lastTax: number;
  selected: BuildId | null;
  focus: { x: number; y: number } | null;
  quests: Quest[];
  built: number;
}
