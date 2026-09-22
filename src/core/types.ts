/** MetroBuilder — full GDD types */

export type Res =
  | 'wood'
  | 'metal'
  | 'plastic'
  | 'glass'
  | 'chemicals'
  | 'planks'
  | 'tools'
  | 'furniture'
  | 'fabric';

export type BuildId =
  | 'road'
  | 'highway'
  | 'house'
  | 'woodcutter'
  | 'mine'
  | 'chem'
  | 'plastics'
  | 'glassworks'
  | 'sawmill'
  | 'workshop'
  | 'furniture'
  | 'textile'
  | 'power'
  | 'solar'
  | 'water'
  | 'sewage'
  | 'waste'
  | 'police'
  | 'fire'
  | 'hospital'
  | 'park'
  | 'school'
  | 'uni'
  | 'station'
  | 'airport'
  | 'cinema'
  | 'stadium'
  | 'landmark'
  | 'depot';

export type Terrain = 'void' | 'grass' | 'water' | 'sand' | 'snow';
export type RegionId = 'valley' | 'desert' | 'coast' | 'snow';

export interface ProduceSpec {
  out: Res;
  amount: number;
  ms: number;
  in?: Partial<Record<Res, number>>;
}

export interface BuildDef {
  id: BuildId;
  name: string;
  cat: 'infra' | 'house' | 'raw' | 'craft' | 'util' | 'civic' | 'special';
  cost: number;
  unlockLv: number;
  needsRoad: boolean;
  power: number;
  water: number;
  produce?: ProduceSpec;
  radius?: number;
  color: string;
  icon: string;
  blurb: string;
  region?: RegionId;
}

export interface HouseTier {
  level: number;
  name: string;
  pop: number;
  tax: number;
  cost: number;
  needs: Partial<Record<Res, number>>;
  needSchool?: boolean;
}

export interface Building {
  id: BuildId;
  level: number;
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
  rewardGems?: number;
  rewardKey?: 'bronze' | 'silver' | 'gold';
  rewardToken?: number;
}

export interface TradeOffer {
  id: string;
  res: Res;
  amount: number;
  price: number;
  from: string;
  expires: number;
}

export interface ClubMember {
  name: string;
  score: number;
  ai: boolean;
}

export interface Game {
  cash: number;
  gems: number;
  keys: { bronze: number; silver: number; gold: number };
  tokens: number;
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
  region: RegionId;
  unlockedRegions: RegionId[];
  disasterUntil: number | null;
  weekScore: number;
  weekEnds: number;
  mayorRank: number;
  club: { name: string; members: ClubMember[]; warScore: number; warTarget: number };
  offers: TradeOffer[];
  lastOfferAt: number;
  stats: { collected: number; upgrades: number; disasters: number };
}
