import { DEFS, BUILD_ORDER } from './catalog';
import type { BuildId, Game } from './types';

export const MAX_LEVEL = 100;

export interface LevelReward {
  cash: number;
  gems: number;
  tokens: number;
  bronze?: number;
  silver?: number;
  gold?: number;
}

export interface LevelUpEvent {
  level: number;
  reward: LevelReward;
  unlocks: BuildId[];
  milestone?: string;
}

export type DiffTier = 'leicht' | 'normal' | 'anspruchsvoll' | 'schwer' | 'extrem' | 'legendär';

export interface Difficulty {
  tier: DiffTier;
  label: string;
  /** Production duration multiplier */
  prod: number;
  /** Build / upgrade cost multiplier */
  cost: number;
  /** Wear accumulation multiplier */
  wear: number;
  /** Extra XP needed flavor (UI) */
  blurb: string;
}

/** Rising difficulty by player level */
export function difficulty(level: number): Difficulty {
  const lv = Math.max(1, Math.min(MAX_LEVEL, level));
  const prod = 1 + (lv - 1) * 0.011;
  const cost = 1 + Math.max(0, lv - 15) * 0.009;
  const wear = 1 + Math.max(0, lv - 10) * 0.012;

  if (lv >= 90) {
    return {
      tier: 'legendär',
      label: 'Legendär',
      prod,
      cost,
      wear,
      blurb: 'Endspiel: lange Produktionszeiten, teure Bauten, starker Verschleiß.',
    };
  }
  if (lv >= 70) {
    return {
      tier: 'extrem',
      label: 'Extrem',
      prod,
      cost,
      wear,
      blurb: 'Extreme Kosten & Wartezeiten — jedes Upgrade zählt.',
    };
  }
  if (lv >= 50) {
    return {
      tier: 'schwer',
      label: 'Schwer',
      prod,
      cost,
      wear,
      blurb: 'Schwere Phase: Ketten und Dienste müssen sitzen.',
    };
  }
  if (lv >= 30) {
    return {
      tier: 'anspruchsvoll',
      label: 'Anspruchsvoll',
      prod,
      cost,
      wear,
      blurb: 'XP und Bauzeiten steigen spürbar.',
    };
  }
  if (lv >= 15) {
    return {
      tier: 'normal',
      label: 'Normal',
      prod,
      cost,
      wear,
      blurb: 'Solides Tempo — erste Kostensteigerungen.',
    };
  }
  return {
    tier: 'leicht',
    label: 'Leicht',
    prod,
    cost,
    wear,
    blurb: 'Einstieg: schnelle Produktion, günstige Bauten.',
  };
}

/**
 * XP to go from `level` → `level+1`.
 * Early soft, mid steep, late brutal (Lv70–100).
 */
export function xpNeeded(level: number): number {
  const lv = Math.max(1, level);
  const base = 90 + lv * 45;
  const quad = lv * lv * 5.5;
  const mid = lv > 25 ? Math.pow(lv - 25, 2.05) * 8 : 0;
  const late = lv > 50 ? Math.pow(lv - 50, 2.2) * 14 : 0;
  const end = lv > 75 ? Math.pow(lv - 75, 2.45) * 28 : 0;
  return Math.floor(base + quad + mid + late + end);
}

export function milestoneAt(level: number): string | undefined {
  const map: Record<number, string> = {
    10: 'Meilenstein: Stadtgründung',
    20: 'Meilenstein: Industriequartier',
    30: 'Meilenstein: Dienstnetz',
    40: 'Meilenstein: Handelsmacht',
    50: 'Meilenstein: Halbzeit-Metropole',
    60: 'Meilenstein: Mega-Cluster',
    70: 'Meilenstein: Kontinentale Stadt',
    80: 'Meilenstein: Weltstadt',
    90: 'Meilenstein: Visionär',
    100: 'Meilenstein: Legende der 100',
  };
  return map[level];
}

export function levelReward(level: number): LevelReward {
  const d = difficulty(level);
  const reward: LevelReward = {
    cash: Math.floor((50 + level * 28) * (0.85 + d.cost * 0.15)),
    gems: level % 3 === 0 ? 2 : 1,
    tokens: level % 5 === 0 ? 1 : 0,
  };
  if (level % 4 === 0) reward.bronze = 1;
  if (level % 8 === 0) reward.silver = 1;
  if (level % 12 === 0) reward.gold = 1;
  if (level >= 10) reward.cash += 100;
  if (level >= 25) {
    reward.cash += 180;
    reward.gems += 1;
  }
  if (level >= 50) {
    reward.cash += 320;
    reward.gems += 1;
    if (level % 5 === 0) reward.tokens = (reward.tokens || 0) + 1;
  }
  if (level >= 75) {
    reward.cash += 500;
    reward.gems += 2;
  }
  if (level === 100) {
    reward.cash += 2500;
    reward.gems += 15;
    reward.tokens = (reward.tokens || 0) + 5;
    reward.gold = (reward.gold || 0) + 3;
  }
  // Milestone bonus packs
  if (milestoneAt(level)) {
    reward.cash = Math.floor(reward.cash * 1.35);
    reward.gems += 2;
  }
  return reward;
}

export function unlocksAt(level: number): BuildId[] {
  return BUILD_ORDER.filter((id) => DEFS[id].unlockLv === level);
}

export function applyReward(g: Game, reward: LevelReward) {
  g.cash += reward.cash;
  g.gems += reward.gems;
  g.tokens += reward.tokens;
  if (reward.bronze) g.keys.bronze += reward.bronze;
  if (reward.silver) g.keys.silver += reward.silver;
  if (reward.gold) g.keys.gold += reward.gold;
}

export function xpProgress(g: Game): { cur: number; need: number; pct: number } {
  const need = xpNeeded(g.level);
  const cur = Math.min(g.xp, need);
  return { cur, need, pct: Math.min(100, Math.round((cur / need) * 100)) };
}

/**
 * Grant XP and resolve any level-ups.
 * Returns list of level-up events (can be multiple if big XP dump).
 */
export function gainXp(g: Game, amount: number): LevelUpEvent[] {
  if (amount <= 0) return [];
  g.xp += amount;
  g.weekScore += amount;
  const me = g.club.members.find((m) => !m.ai);
  if (me) me.score += amount;

  const events: LevelUpEvent[] = [];
  while (g.level < MAX_LEVEL) {
    const need = xpNeeded(g.level);
    if (g.xp < need) break;
    g.xp -= need;
    g.level += 1;
    const reward = levelReward(g.level);
    applyReward(g, reward);
    events.push({
      level: g.level,
      reward,
      unlocks: unlocksAt(g.level),
      milestone: milestoneAt(g.level),
    });
  }
  if (g.level >= MAX_LEVEL) g.xp = 0;
  return events;
}

export function nextUnlocks(g: Game, count = 4): Array<{ level: number; ids: BuildId[] }> {
  const out: Array<{ level: number; ids: BuildId[] }> = [];
  for (let lv = g.level + 1; lv <= MAX_LEVEL && out.length < count; lv++) {
    const ids = unlocksAt(lv);
    if (ids.length) out.push({ level: lv, ids });
  }
  return out;
}

export function nextMilestones(g: Game, count = 4): Array<{ level: number; title: string }> {
  const out: Array<{ level: number; title: string }> = [];
  for (let lv = g.level + 1; lv <= MAX_LEVEL && out.length < count; lv++) {
    const title = milestoneAt(lv);
    if (title) out.push({ level: lv, title });
  }
  return out;
}

export function roadmap(): Array<{ level: number; ids: BuildId[] }> {
  const map = new Map<number, BuildId[]>();
  for (const id of BUILD_ORDER) {
    const lv = DEFS[id].unlockLv;
    if (!map.has(lv)) map.set(lv, []);
    map.get(lv)!.push(id);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, ids]) => ({ level, ids }));
}

/** Scaled building cost at current player level */
export function scaledCost(base: number, level: number): number {
  return Math.max(1, Math.floor(base * difficulty(level).cost));
}

/** Scaled production duration */
export function scaledProdMs(baseMs: number, level: number, wear: number, regionSnow: boolean, usesPower: boolean): number {
  const d = difficulty(level);
  const region = regionSnow && usesPower ? 1.15 : 1;
  return baseMs * (1 + wear / 100) * region * d.prod;
}
