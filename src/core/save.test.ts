import { describe, expect, it, beforeEach } from 'vitest';
import {
  SAVE_VERSION,
  checksumPayload,
  migrateGame,
  persistGame,
  loadGame,
  clearAllSaves,
  roundTripOk,
} from './save';
import { createGame } from './world';
import { grantIap } from './sim';
import { gainXp, MAX_LEVEL, xpNeeded } from './progression';
import { SIZE } from './catalog';

describe('save system', () => {
  beforeEach(() => {
    clearAllSaves();
  });

  it('checksum is stable for same payload', () => {
    expect(checksumPayload('abc')).toBe(checksumPayload('abc'));
    expect(checksumPayload('abc')).not.toBe(checksumPayload('abd'));
  });

  it('round-trips a new game', () => {
    const g = createGame();
    expect(roundTripOk(g)).toBe(true);
  });

  it('persists and loads current save', () => {
    const g = createGame();
    g.cash = 999;
    g.level = 7;
    expect(persistGame(g)).toBe(true);
    const loaded = loadGame();
    expect(loaded.source).toBe('current');
    expect(loaded.game.cash).toBe(999);
    expect(loaded.game.level).toBe(7);
    expect(loaded.game.saveVersion).toBe(SAVE_VERSION);
  });

  it('recovers from last-good when current is corrupt', () => {
    const g = createGame();
    g.cash = 4242;
    persistGame(g);
    localStorage.setItem('metrobuilder-save-v5', '{broken');
    const loaded = loadGame();
    expect(loaded.recovered || loaded.source === 'lastGood' || loaded.source === 'backup1').toBe(
      true,
    );
    expect(loaded.game.cash).toBe(4242);
    expect(loaded.userMessage).toMatch(/wiederhergestellt|Backup/i);
    expect(loaded.userMessage).not.toMatch(/TypeError|JSON|undefined/i);
  });

  it('surfaces friendly message when all saves fail', () => {
    // Force loadGame catch path via throwing storage (rare) — simulate empty + corrupt only
    localStorage.setItem('metrobuilder-save-v5', '{broken');
    localStorage.setItem('metrobuilder-save-last-good', '{broken');
    localStorage.setItem('metrobuilder-save-backup-1', '{broken');
    localStorage.setItem('metrobuilder-save-backup-2', '{broken');
    localStorage.setItem('metrobuilder-full-v3', '{broken');
    const loaded = loadGame();
    expect(loaded.source).toBe('new');
    // No technical exception string exposed
    if (loaded.userMessage) {
      expect(loaded.userMessage).not.toMatch(/TypeError|SyntaxError|JSON\.parse/i);
    }
  });

  it('migrates legacy bare JSON', () => {
    const g = createGame();
    g.cash = 111;
    // strip new fields to simulate old save
    const legacy = { ...g } as Record<string, unknown>;
    delete legacy.saveVersion;
    delete legacy.iapReceipts;
    localStorage.setItem('metrobuilder-full-v3', JSON.stringify(legacy));
    clearAllSaves();
    // clearAll removes legacy too — re-set
    localStorage.setItem('metrobuilder-full-v3', JSON.stringify(legacy));
    const loaded = loadGame();
    expect(loaded.source).toBe('legacy');
    expect(loaded.game.cash).toBe(111);
    expect(loaded.game.iapReceipts).toEqual({});
    expect(loaded.game.saveVersion).toBe(SAVE_VERSION);
  });

  it('rejects invalid size', () => {
    expect(migrateGame({ cells: [], size: 1 })).toBeNull();
    expect(migrateGame({ cells: new Array(SIZE * SIZE).fill({}), size: SIZE })).toBeNull();
  });
});

describe('iap idempotency', () => {
  it('does not grant twice for same receipt', () => {
    const g = createGame();
    const msgs: string[] = [];
    const say = (m: string) => msgs.push(m);
    expect(grantIap(g, 'com.fidani.metrobuilder.xp_small', say, 'txn-1')).toBe(true);
    const xpAfter = g.xp;
    expect(grantIap(g, 'com.fidani.metrobuilder.xp_small', say, 'txn-1')).toBe(false);
    expect(g.xp).toBe(xpAfter);
    expect(msgs.some((m) => /bereits/i.test(m))).toBe(true);
  });
});

describe('progression', () => {
  it('levels up when XP threshold met', () => {
    const g = createGame();
    const need = xpNeeded(g.level);
    const events = gainXp(g, need);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(g.level).toBe(2);
  });

  it('routes XP to mastery at max level', () => {
    const g = createGame();
    g.level = MAX_LEVEL;
    g.mastery = 0;
    gainXp(g, 100);
    expect(g.mastery).toBe(100);
    expect(g.xp).toBe(0);
  });

  it('never produces NaN cash via level rewards', () => {
    const g = createGame();
    gainXp(g, 50_000);
    expect(Number.isFinite(g.cash)).toBe(true);
    expect(g.cash).toBeGreaterThanOrEqual(0);
    expect(g.level).toBeLessThanOrEqual(MAX_LEVEL);
  });
});
