import type { Game } from './types';
import { xp } from './world';

export interface Achievement {
  id: string;
  title: string;
  blurb: string;
  icon: string;
  rewardCash: number;
  rewardGems: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_road', title: 'Straßennetz', blurb: '10 Straßen gebaut', icon: '═', rewardCash: 80, rewardGems: 1 },
  { id: 'collector', title: 'Sammler', blurb: '100 Ressourcen eingesammelt', icon: '📦', rewardCash: 120, rewardGems: 2 },
  { id: 'mayor10', title: 'Stadtrat', blurb: 'Level 10 erreicht', icon: '⭐', rewardCash: 200, rewardGems: 3 },
  { id: 'mayor30', title: 'Großstadt', blurb: 'Level 30 erreicht', icon: '🏙️', rewardCash: 400, rewardGems: 5 },
  { id: 'mayor50', title: 'Metropole', blurb: 'Level 50 erreicht', icon: '🌐', rewardCash: 800, rewardGems: 8 },
  { id: 'mayor100', title: 'Legende', blurb: 'Level 100 erreicht', icon: '👑', rewardCash: 2500, rewardGems: 20 },
  { id: 'upgrader', title: 'Sanierer', blurb: '10 Haus-Upgrades', icon: '🏠', rewardCash: 150, rewardGems: 2 },
  { id: 'explorer', title: 'Entdecker', blurb: '3 Regionen freigeschaltet', icon: '🗺️', rewardCash: 300, rewardGems: 4 },
  { id: 'survivor', title: 'Krisenmanager', blurb: '3 Katastrophen überstanden', icon: '🌪️', rewardCash: 180, rewardGems: 2 },
  { id: 'clubber', title: 'Club-Held', blurb: 'Club-Krieg Ziel erreicht', icon: '👥', rewardCash: 220, rewardGems: 3 },
  { id: 'rich', title: 'Steuerkönig', blurb: '5000 Credits Besitz', icon: '💰', rewardCash: 100, rewardGems: 1 },
  { id: 'daily3', title: 'Treue', blurb: '3 Daily-Boni abgeholt', icon: '📅', rewardCash: 150, rewardGems: 2 },
];

export function ensureMeta(g: Game) {
  if (!g.achievements) g.achievements = {};
  if (g.dailyStreak == null) g.dailyStreak = 0;
  if (g.lastDailyAt == null) g.lastDailyAt = 0;
  if (g.tutorialStep == null) g.tutorialStep = 0;
  if (g.mastery == null) g.mastery = 0;
  if (!g.stats) g.stats = { collected: 0, upgrades: 0, disasters: 0, dailies: 0 };
  if (g.stats.dailies == null) g.stats.dailies = 0;
}

export type TutorialStep = {
  id: number;
  title: string;
  body: string;
};

export const TUTORIAL: TutorialStep[] = [
  {
    id: 0,
    title: 'Willkommen, Bürgermeister!',
    body: 'Ziehe die Karte mit dem Finger. Tippe ein Feld an, um Details zu sehen.',
  },
  {
    id: 1,
    title: 'Straßen legen',
    body: 'Wähle unten „Straße“ und tippe leere Felder an — Gebäude brauchen Anschluss.',
  },
  {
    id: 2,
    title: 'Produzieren & sammeln',
    body: 'Wenn über einem Gebäude ¢ erscheint: tippen zum Einsammeln. Das bringt XP!',
  },
  {
    id: 3,
    title: 'Aufstieg',
    body: 'Im Tab „Aufstieg“ siehst du Level, Schwierigkeit, Soft-Credits und Echtgeld-IAP.',
  },
  {
    id: 4,
    title: 'Fertig!',
    body: 'Erweitere die Stadt, erfülle Quests und werde Legende der 100. Viel Erfolg!',
  },
];

function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function canClaimDaily(g: Game): boolean {
  ensureMeta(g);
  if (!g.lastDailyAt) return true;
  return dayKey(g.lastDailyAt) !== dayKey();
}

export function claimDaily(
  g: Game,
  say: (m: string) => void,
): boolean {
  ensureMeta(g);
  if (!canClaimDaily(g)) {
    say('Daily heute schon abgeholt.');
    return false;
  }
  const yesterday = Date.now() - 36 * 3600_000;
  const streak =
    g.lastDailyAt && dayKey(g.lastDailyAt) === dayKey(yesterday) ? g.dailyStreak + 1 : 1;
  g.dailyStreak = Math.min(30, streak);
  g.lastDailyAt = Date.now();
  const cash = 40 + g.dailyStreak * 15 + g.level * 2;
  const gems = g.dailyStreak % 3 === 0 ? 2 : 1;
  g.cash += cash;
  g.gems += gems;
  g.stats.dailies = (g.stats.dailies || 0) + 1;
  xp(g, 15);
  say(`Daily +${cash}¢ +${gems}💎 (Serie ${g.dailyStreak})`);
  checkAchievements(g, say);
  return true;
}

export function unlockAchievement(g: Game, id: string, say: (m: string) => void): boolean {
  ensureMeta(g);
  if (g.achievements[id]) return false;
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return false;
  g.achievements[id] = true;
  g.cash += a.rewardCash;
  g.gems += a.rewardGems;
  say(`🏆 ${a.title}! +${a.rewardCash}¢`);
  return true;
}

export function checkAchievements(g: Game, say: (m: string) => void) {
  ensureMeta(g);
  const roads = g.cells.filter((c) => c.b && (c.b.id === 'road' || c.b.id === 'highway')).length;
  if (roads >= 10) unlockAchievement(g, 'first_road', say);
  if (g.stats.collected >= 100) unlockAchievement(g, 'collector', say);
  if (g.level >= 10) unlockAchievement(g, 'mayor10', say);
  if (g.level >= 30) unlockAchievement(g, 'mayor30', say);
  if (g.level >= 50) unlockAchievement(g, 'mayor50', say);
  if (g.level >= 100) unlockAchievement(g, 'mayor100', say);
  if (g.stats.upgrades >= 10) unlockAchievement(g, 'upgrader', say);
  if (g.unlockedRegions.length >= 3) unlockAchievement(g, 'explorer', say);
  if (g.stats.disasters >= 3) unlockAchievement(g, 'survivor', say);
  if (g.club.warScore >= g.club.warTarget) unlockAchievement(g, 'clubber', say);
  if (g.cash >= 5000) unlockAchievement(g, 'rich', say);
  if ((g.stats.dailies || 0) >= 3) unlockAchievement(g, 'daily3', say);
}

/**
 * After max level: XP becomes mastery. Call after gainXp already added amount,
 * or pass the delta to apply rewards for crossing 500-point thresholds.
 */
export function applyMasteryBonus(
  g: Game,
  prevMastery: number,
  say?: (m: string) => void,
) {
  ensureMeta(g);
  const crossed = Math.floor(g.mastery / 500) - Math.floor(prevMastery / 500);
  if (crossed <= 0) return;
  g.cash += 100 * crossed;
  g.gems += crossed;
  say?.(`Meisterschaft ${g.mastery} — Bonus +${100 * crossed}¢`);
}
