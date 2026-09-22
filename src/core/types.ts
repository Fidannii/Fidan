import type { LevelUpEvent } from './progression';

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
  avatar: string;
  expires: number;
}

export interface ClubMember {
  name: string;
  score: number;
  ai: boolean;
  avatar: string;
}

export interface HappinessCause {
  label: string;
  delta: number;
}

export interface CashflowSnap {
  taxes: number;
  commerce: number;
  industry: number;
  maintenance: number;
  services: number;
  /** V3: road upkeep */
  roads?: number;
  /** V3: bus / transit operating cost */
  transport?: number;
  net: number;
  incomePerPeriod?: number;
  expensesPerPeriod?: number;
  forecastShort?: number;
  forecastMedium?: number;
}

export interface DemandSnap {
  residential: number;
  commercial: number;
  industrial: number;
}

export interface ServiceSnap {
  kind: string;
  label: string;
  capacity: number;
  demand: number;
  load: number;
  quality: number;
}

export interface CitySim {
  pop: number;
  housing: number;
  houses: number;
  jobs: number;
  employed: number;
  unemployment: number;
  sat: number;
  causes: HappinessCause[];
  demand: DemandSnap;
  services: ServiceSnap[];
  landAvg: number;
  cashflow: CashflowSnap;
  taxMs: number;
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
  stats: { collected: number; upgrades: number; disasters: number; dailies: number };
  pendingLevelUps: LevelUpEvent[];
  /** unlocked achievement ids */
  achievements: Record<string, boolean>;
  dailyStreak: number;
  lastDailyAt: number;
  /** 0..n tutorial; >= TUTORIAL.length means done; -1 skipped */
  tutorialStep: number;
  /** post-level-100 mastery score */
  mastery: number;
  /** envelope / migration version */
  saveVersion: number;
  /** IAP transaction ids already granted (idempotency) */
  iapReceipts: Record<string, number>;
  /** cached Simulation Core 2.0 snapshot */
  sim?: CitySim;
  lastSimAt?: number;
  /** Phase 3 traffic snapshot */
  traffic?: {
    segments: number;
    volume: number;
    capacity: number;
    congestion: number;
    busStops: number;
  };
  /** Phase 4 */
  cityTier?: 'dorf' | 'kleinstadt' | 'stadt' | 'grossstadt' | 'metropole';
  specialization?: 'none' | 'green' | 'industry' | 'finance' | 'tourism';
  /** Phase 5 persistent cities */
  cities?: Partial<
    Record<
      RegionId,
      {
        region: RegionId;
        cells: Cell[];
        size: number;
        unlock: number;
        built: number;
        disasterUntil: number | null;
        offers: TradeOffer[];
        lastOfferAt: number;
        quests: Quest[];
        specialization: Game['specialization'];
        cityTier: Game['cityTier'];
        localCash: number;
        localInv: Record<Res, number>;
      }
    >
  >;
  /** Phase 4/6 events */
  activeEvent?: {
    id: string;
    title: string;
    body: string;
    investCost: number;
    investLabel: string;
    ignoreLabel: string;
  } | null;
  nextEventAt?: number;
  eventPrep?: number;
  /** Phase 7 stub: last local cloud-sync marker (not a real cloud save) */
  cloudSyncAt?: number;
  /** V3 deterministic sim */
  seed?: number;
  rngCount?: number;
  simTimeMs?: number;
  gameSpeed?: 'pause' | '1x' | '2x' | '4x';
  /** Tax multiplier 0.5–1.5 (1 = baseline) */
  taxRate?: number;
  /** Traffic V2 */
  roadsDirty?: boolean;
  routeCache?: { key: string; routes: Record<string, string[]> };
  trafficGraph?: {
    avgCongestion: number;
    avgTravelFactor: number;
    nodeCount: number;
    edgeCount: number;
    tripCount: number;
    recomputeMs: number;
    version: number;
    edgeCongestion: Record<string, number>;
  };
  /** Bus vertical slice */
  busLines?: Array<{
    id: string;
    name: string;
    stopOrder: Array<{ x: number; y: number }>;
    frequency: number;
    capacity: number;
    operatingCost: number;
    ridership: number;
    active: boolean;
  }>;
  busRidership?: number;
  /** Events V2 delayed effects */
  pendingEffects?: Array<{
    id: string;
    atSim: number;
    kind: string;
    payload?: Record<string, number | string>;
  }>;
  eventCooldowns?: Record<string, number>;
  /** Perf metrics (ephemeral ok) */
  metrics?: {
    lastTickMs?: number;
    lastTrafficMs?: number;
    lastSaveMs?: number;
  };
}
