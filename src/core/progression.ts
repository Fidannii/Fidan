import { DEFS, BUILD_ORDER } from './catalog';
import type { BuildId, Game } from './types';

export const MAX_LEVEL = 30;

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
}

/** Rising XP curve — early levels fast, later slower */
export function xpNeeded(level: number): number {
  return Math.floor(70 + level * 55 + level * level * 8);
}

export function levelReward(level: number): LevelReward {
  const reward: LevelReward = {
    cash: 40 + level * 25,
    gems: level % 3 === 0 ? 2 : 1,
    tokens: level % 5 === 0 ? 1 : 0,
  };
  if (level % 4 === 0) reward.bronze = 1;
  if (level % 8 === 0) reward.silver = 1;
  if (level % 12 === 0) reward.gold = 1;
  if (level >= 10) reward.cash += 80;
  if (level >= 20) {
    reward.cash += 150;
    reward.gems += 1;
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
