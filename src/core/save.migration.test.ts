import { describe, expect, it, beforeEach } from 'vitest';
import { createGame } from './world';
import { clearAllSaves, migrateGame, SAVE_VERSION, persistGame, loadGame } from './save';
import { SIZE } from './catalog';

/** Minimal valid cell grid for migration fixtures */
function cellsFor(g: ReturnType<typeof createGame>) {
  return g.cells.map((c) => ({ ...c }));
}

function baseLegacy(fromVersion: number) {
  const g = createGame();
  const raw: Record<string, unknown> = {
    size: SIZE,
    cells: cellsFor(g),
    cash: 2500,
    xp: 40,
    level: 2,
    inv: { ...g.inv },
    club: { ...g.club, members: [...g.club.members] },
    offers: [...(g.offers || [])],
    keys: { ...g.keys },
    gems: g.gems,
    tokens: g.tokens,
    region: g.region,
    unlockedRegions: [...g.unlockedRegions],
    quests: g.quests,
    saveVersion: fromVersion,
  };
  return raw;
}

describe('save migration matrix', () => {
  beforeEach(() => clearAllSaves());

  it('v5 → v8: no data loss on cash/level', () => {
    const raw = baseLegacy(5);
    delete raw.seed;
    delete raw.simTimeMs;
    delete raw.taxRate;
    delete raw.busLines;
    const m = migrateGame(raw);
    expect(m).not.toBeNull();
    expect(m!.saveVersion).toBe(SAVE_VERSION);
    expect(m!.cash).toBe(2500);
    expect(m!.level).toBe(2);
    expect(m!.taxRate).toBe(1);
    expect(m!.busLines).toEqual([]);
    expect(Number.isFinite(m!.seed)).toBe(true);
  });

  it('v6 → v8: keeps progression', () => {
    const raw = baseLegacy(6);
    raw.specialization = 'none';
    raw.cityTier = 'dorf';
    const m = migrateGame(raw);
    expect(m).not.toBeNull();
    expect(m!.saveVersion).toBe(SAVE_VERSION);
    expect(m!.cash).toBe(2500);
    expect(m!.specialization).toBe('none');
  });

  it('v7 → v8: cities/events survive; sim caches cleared', () => {
    const raw = baseLegacy(7);
    raw.cities = { valley: { cash: 1 } };
    raw.activeEvent = null;
    raw.eventPrep = 0;
    raw.sim = { stale: true };
    raw.trafficGraph = { stale: true };
    const m = migrateGame(raw);
    expect(m).not.toBeNull();
    expect(m!.saveVersion).toBe(SAVE_VERSION);
    expect(m!.cash).toBe(2500);
    expect(m!.cities).toBeTruthy();
    expect(m!.sim).toBeUndefined();
    expect(m!.trafficGraph).toBeUndefined();
    expect(m!.pendingEffects).toEqual([]);
  });

  it('v8 → v8: identity round-trip fields', () => {
    const g = createGame();
    g.cash = 777;
    g.seed = 42;
    g.taxRate = 1.2;
    g.simTimeMs = 9000;
    const m = migrateGame({ ...g });
    expect(m!.cash).toBe(777);
    expect(m!.seed).toBe(42);
    expect(m!.taxRate).toBeCloseTo(1.2);
    expect(m!.simTimeMs).toBe(9000);
    expect(m!.saveVersion).toBe(SAVE_VERSION);
  });

  it('recovery: primary+backup1 corrupt → lastGood', () => {
    const g = createGame();
    g.cash = 4242;
    persistGame(g);
    localStorage.setItem('metrobuilder-save-v5', '{x');
    localStorage.setItem('metrobuilder-save-backup-1', '{x');
    const loaded = loadGame();
    expect(loaded.game.cash).toBe(4242);
    expect(loaded.source).not.toBe('new');
    expect(loaded.userMessage || '').not.toMatch(/TypeError|JSON\.parse/i);
  });

  it('recovery: only backup2 left', () => {
    const g = createGame();
    g.cash = 111;
    persistGame(g);
    g.cash = 222;
    persistGame(g);
    g.cash = 333;
    persistGame(g);
    localStorage.removeItem('metrobuilder-save-v5');
    localStorage.removeItem('metrobuilder-save-last-good');
    localStorage.removeItem('metrobuilder-save-backup-1');
    const loaded = loadGame();
    expect(loaded.source).toBe('backup2');
    expect(loaded.game.cash).toBeGreaterThan(0);
    expect(loaded.source).not.toBe('new');
  });
});
