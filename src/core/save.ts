/**
 * Versioned save system — Phase 0 hardening.
 * Atomic local write, rotating backups, checksum, migrations, recovery.
 */

import { SAVE as LEGACY_SAVE, SIZE } from './catalog';
import type { Game } from './types';
import { createGame } from './world';

/** Current envelope schema version */
export const SAVE_VERSION = 8;

const KEY_CURRENT = 'metrobuilder-save-v5';
const KEY_TMP = 'metrobuilder-save-v5-tmp';
const KEY_BACKUP_1 = 'metrobuilder-save-backup-1';
const KEY_BACKUP_2 = 'metrobuilder-save-backup-2';
const KEY_LAST_GOOD = 'metrobuilder-save-last-good';

export interface SaveEnvelope {
  saveVersion: number;
  checksum: string;
  savedAt: number;
  data: Game;
}

export type LoadSource =
  | 'current'
  | 'lastGood'
  | 'backup1'
  | 'backup2'
  | 'legacy'
  | 'new';

export interface LoadResult {
  game: Game;
  source: LoadSource;
  recovered: boolean;
  /** User-facing message; never a raw exception string */
  userMessage?: string;
}

function storage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

/** Fast non-crypto checksum for integrity (not security) */
export function checksumPayload(payload: string): string {
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function envelopeOf(g: Game): SaveEnvelope {
  const data = { ...g, selected: null, focus: null, saveVersion: SAVE_VERSION };
  const body = JSON.stringify(data);
  return {
    saveVersion: SAVE_VERSION,
    checksum: checksumPayload(body),
    savedAt: Date.now(),
    data: data as Game,
  };
}

function parseEnvelope(raw: string): SaveEnvelope | null {
  try {
    const env = JSON.parse(raw) as SaveEnvelope;
    if (!env || typeof env !== 'object' || !env.data) return null;
    if (typeof env.checksum !== 'string' || typeof env.saveVersion !== 'number') return null;
    const body = JSON.stringify(env.data);
    if (checksumPayload(body) !== env.checksum) return null;
    return env;
  } catch {
    return null;
  }
}

/** Migrate raw game object from any older shape to SAVE_VERSION */
export function migrateGame(raw: unknown): Game | null {
  if (!raw || typeof raw !== 'object') return null;
  const g = raw as Game;

  if (!Array.isArray(g.cells) || !g.cells.length || g.size !== SIZE) return null;
  if (!g.inv || !g.club) return null;

  g.selected = null;
  g.focus = null;

  const defaults = ['player', 'lina', 'omar', 'mira'];
  g.club.members = (g.club.members || []).map((m, i) => ({
    ...m,
    avatar: m.avatar || defaults[i] || 'player',
  }));
  g.offers = (g.offers || []).map((o) => ({
    ...o,
    avatar: o.avatar || 'alex',
  }));

  if (!g.pendingLevelUps) g.pendingLevelUps = [];
  if (!g.achievements) g.achievements = {};
  if (g.dailyStreak == null) g.dailyStreak = 0;
  if (g.lastDailyAt == null) g.lastDailyAt = 0;
  if (g.tutorialStep == null) g.tutorialStep = 0;
  if (g.mastery == null) g.mastery = 0;
  if (!g.stats) g.stats = { collected: 0, upgrades: 0, disasters: 0, dailies: 0 };
  if (g.stats.dailies == null) g.stats.dailies = 0;
  if (!g.iapReceipts) g.iapReceipts = {};
  if (g.saveVersion == null) g.saveVersion = 5;
  const fromVersion = g.saveVersion;
  // v5 → v6: Simulation Core 2.0 cache fields (recomputed)
  // v6 → v7: city life / traffic / multi-city / events
  // v7 → v8: seed, sim clock, taxRate, traffic graph, bus lines, delayed events
  g.sim = undefined;
  g.lastSimAt = undefined;
  g.traffic = undefined;
  g.trafficGraph = undefined;
  g.routeCache = undefined;
  g.roadsDirty = true;
  if (!g.specialization) g.specialization = 'none';
  if (!g.cityTier) g.cityTier = 'dorf';
  if (!g.cities) g.cities = {};
  if (g.activeEvent === undefined) g.activeEvent = null;
  if (g.eventPrep == null) g.eventPrep = 0;
  if (g.seed == null || !Number.isFinite(g.seed)) {
    g.seed = (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0;
  }
  if (g.rngCount == null || g.rngCount < 0) g.rngCount = 0;
  // Pre-v8 used wall-clock Date.now() for timers — keep continuity
  if (fromVersion < 8) {
    if (g.simTimeMs == null || !Number.isFinite(g.simTimeMs)) g.simTimeMs = Date.now();
  } else if (g.simTimeMs == null || !Number.isFinite(g.simTimeMs)) {
    g.simTimeMs = 0;
  }
  if (g.nextEventAt == null) g.nextEventAt = (g.simTimeMs || 0) + 90_000;
  if (!g.gameSpeed) g.gameSpeed = '1x';
  if (g.taxRate == null || !Number.isFinite(g.taxRate)) g.taxRate = 1;
  g.taxRate = Math.max(0.5, Math.min(1.5, g.taxRate));
  if (!g.busLines) g.busLines = [];
  if (g.busRidership == null) g.busRidership = 0;
  if (!g.pendingEffects) g.pendingEffects = [];
  if (!g.eventCooldowns) g.eventCooldowns = {};
  g.saveVersion = SAVE_VERSION;

  if (typeof g.cash !== 'number' || Number.isNaN(g.cash)) return null;
  if (typeof g.level !== 'number' || g.level < 1) return null;
  if (g.level > 100) g.level = 100;
  if (g.cash < 0) g.cash = 0;
  if (g.xp < 0) g.xp = 0;
  if (!Number.isFinite(g.cash) || !Number.isFinite(g.xp)) return null;

  return g;
}

function readKey(key: string): Game | null {
  const ls = storage();
  if (!ls) return null;
  const raw = ls.getItem(key);
  if (!raw) return null;

  // New envelope format
  const env = parseEnvelope(raw);
  if (env) {
    return migrateGame(env.data);
  }

  // Legacy bare Game JSON
  try {
    return migrateGame(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeKey(key: string, env: SaveEnvelope): boolean {
  const ls = storage();
  if (!ls) return false;
  try {
    ls.setItem(key, JSON.stringify(env));
    return true;
  } catch {
    return false;
  }
}

/**
 * Atomic-ish save: write tmp → rotate backups → commit current → mark last-good.
 */
export function persistGame(g: Game): boolean {
  const env = envelopeOf(g);
  const ls = storage();
  if (!ls) return false;

  try {
    // 1) temp
    if (!writeKey(KEY_TMP, env)) return false;

    // 2) rotate backups (current → backup1 → backup2)
    const cur = ls.getItem(KEY_CURRENT);
    const b1 = ls.getItem(KEY_BACKUP_1);
    if (b1) ls.setItem(KEY_BACKUP_2, b1);
    if (cur) ls.setItem(KEY_BACKUP_1, cur);

    // 3) commit current from tmp
    ls.setItem(KEY_CURRENT, ls.getItem(KEY_TMP)!);
    ls.removeItem(KEY_TMP);

    // 4) last known good
    ls.setItem(KEY_LAST_GOOD, JSON.stringify(env));

    // Keep legacy key in sync for one version (migration bridge)
    ls.setItem(LEGACY_SAVE, JSON.stringify(env.data));

    return true;
  } catch {
    return false;
  }
}

export function loadGame(): LoadResult {
  try {
    const order: Array<{ key: string; source: LoadSource }> = [
      { key: KEY_CURRENT, source: 'current' },
      { key: KEY_LAST_GOOD, source: 'lastGood' },
      { key: KEY_BACKUP_1, source: 'backup1' },
      { key: KEY_BACKUP_2, source: 'backup2' },
      { key: LEGACY_SAVE, source: 'legacy' },
    ];

    for (const { key, source } of order) {
      const game = readKey(key);
      if (game) {
        const recovered = source !== 'current' && source !== 'legacy';
        return {
          game,
          source,
          recovered,
          userMessage: recovered
            ? 'Spielstand wiederhergestellt (Backup).'
            : source === 'legacy'
              ? 'Spielstand migriert.'
              : undefined,
        };
      }
    }

    return { game: createGame(), source: 'new', recovered: false };
  } catch {
    return {
      game: createGame(),
      source: 'new',
      recovered: false,
      userMessage: 'Spielstand konnte nicht geladen werden. Neues Spiel gestartet.',
    };
  }
}

export function clearAllSaves() {
  const ls = storage();
  if (!ls) return;
  for (const k of [
    KEY_CURRENT,
    KEY_TMP,
    KEY_BACKUP_1,
    KEY_BACKUP_2,
    KEY_LAST_GOOD,
    LEGACY_SAVE,
    'metrobuilder-core-intro',
    'metrobuilder-full-intro',
  ]) {
    ls.removeItem(k);
  }
}

/** Test helper: validate round-trip integrity */
export function roundTripOk(g: Game): boolean {
  const env = envelopeOf(g);
  const raw = JSON.stringify(env);
  const parsed = parseEnvelope(raw);
  if (!parsed) return false;
  const mig = migrateGame(parsed.data);
  return !!mig && mig.level === g.level && mig.cash === g.cash;
}
