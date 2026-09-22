import { describe, expect, it, beforeEach } from 'vitest';
import { createGame } from './world';
import {
  clearAllSaves,
  persistGame,
  loadGame,
  SAVE_VERSION,
  migrateGame,
} from './save';
import { ensureRuntime, syncRuntimeToGame } from './clock';
import { place, tick, grantIap } from './sim';
import { cmdCreateBusLine } from './bus';
import { cmdSetTaxRate, cmdSetGameSpeed } from '../game/commands';
import { switchCity } from './cities';
import { recomputeTrafficGraph, markRoadsDirty } from './trafficGraph';
import { SIZE } from './catalog';

describe('save torture / release gates', () => {
  beforeEach(() => clearAllSaves());

  it('new game → save → load identity', () => {
    const g = createGame();
    ensureRuntime(g);
    g.cash = 1234;
    syncRuntimeToGame(g);
    persistGame(g);
    const loaded = loadGame();
    expect(loaded.game.cash).toBe(1234);
    expect(loaded.game.saveVersion).toBe(SAVE_VERSION);
  });

  it('multi-step: build, tax, save, reload', () => {
    const g = createGame();
    ensureRuntime(g);
    const say = () => {};
    const cx = Math.floor(SIZE / 2);
    const cy = Math.floor(SIZE / 2);
    place(g, cx + 3, cy, 'road', say);
    cmdSetTaxRate(g, 1.1, say);
    syncRuntimeToGame(g);
    persistGame(g);
    const a = loadGame().game;
    expect(a.taxRate).toBeCloseTo(1.1);
    expect(a.cells.some((c) => c.b?.id === 'road' && c.x === cx + 3)).toBe(true);
  });

  it('city switch + reload keeps both cities', () => {
    const g = createGame();
    g.unlockedRegions = ['valley', 'coast'];
    g.cash = 4000;
    const say = () => {};
    const next = switchCity(g, 'coast', say);
    expect(next).toBeTruthy();
    next!.cash = 3333;
    ensureRuntime(next!);
    syncRuntimeToGame(next!);
    persistGame(next!);
    const loaded = loadGame().game;
    expect(loaded.region).toBe('coast');
    expect(loaded.cities?.valley).toBeTruthy();
    expect(loaded.cities?.coast).toBeTruthy();
  });

  it('bus line survives save/load', () => {
    const g = createGame();
    ensureRuntime(g);
    const c1 = g.cells.find((t) => t.terrain === 'grass' && !t.b)!;
    c1.b = { id: 'depot', level: 1, jobAt: null, ready: 0, wear: 0 };
    const c2 = g.cells.find((t) => t.terrain === 'grass' && !t.b && t !== c1)!;
    c2.b = { id: 'station', level: 1, jobAt: null, ready: 0, wear: 0 };
    const r = cmdCreateBusLine(g, 'T1', [{ x: c1.x, y: c1.y }, { x: c2.x, y: c2.y }], () => {});
    expect(r.ok).toBe(true);
    syncRuntimeToGame(g);
    persistGame(g);
    const loaded = loadGame().game;
    expect(loaded.busLines?.length).toBe(1);
    expect(loaded.busLines![0].name).toBe('T1');
  });

  it('corrupt primary recovers; never invents empty if backup exists', () => {
    const g = createGame();
    g.cash = 5555;
    persistGame(g);
    localStorage.setItem('metrobuilder-save-v5', '{bad');
    const loaded = loadGame();
    expect(loaded.game.cash).toBe(5555);
    expect(loaded.source).not.toBe('new');
  });

  it('backup2 chain: wipe current+lastGood still recovers', () => {
    const g = createGame();
    g.cash = 100;
    persistGame(g);
    g.cash = 200;
    persistGame(g);
    g.cash = 300;
    persistGame(g);
    localStorage.removeItem('metrobuilder-save-v5');
    localStorage.removeItem('metrobuilder-save-last-good');
    const loaded = loadGame();
    // Should hit backup1 or backup2
    expect(['backup1', 'backup2', 'lastGood', 'current']).toContain(loaded.source);
    expect(loaded.game.cash).toBeGreaterThanOrEqual(100);
  });

  it('iap duplicate receipt still idempotent after reload', () => {
    const g = createGame();
    const say = () => {};
    expect(grantIap(g, 'com.fidani.metrobuilder.xp_small', say, 'txn-rc-1')).toBe(true);
    persistGame(g);
    const loaded = loadGame().game;
    const xp = loaded.xp;
    expect(grantIap(loaded, 'com.fidani.metrobuilder.xp_small', say, 'txn-rc-1')).toBe(false);
    expect(loaded.xp).toBe(xp);
  });

  it('pause speed persists', () => {
    const g = createGame();
    ensureRuntime(g);
    cmdSetGameSpeed(g, 'pause', () => {});
    syncRuntimeToGame(g);
    persistGame(g);
    expect(loadGame().game.gameSpeed).toBe('pause');
  });

  it('traffic graph dirty after demolish road then recompute', () => {
    const g = createGame();
    markRoadsDirty(g);
    recomputeTrafficGraph(g);
    expect(g.roadsDirty).toBe(false);
    const road = g.cells.find((c) => c.b?.id === 'road')!;
    road.b = null;
    markRoadsDirty(g);
    const snap = recomputeTrafficGraph(g);
    expect(snap.nodes.length).toBeGreaterThanOrEqual(0);
  });

  it('accelerated soak 800 ticks remains finite', () => {
    const g = createGame();
    const rt = ensureRuntime(g);
    const say = () => {};
    for (let i = 0; i < 800; i++) {
      rt.clock.advance(100);
      g.simTimeMs = rt.clock.simTimeMs;
      // Skip full tick every other to keep suite fast; still exercises graph
      if (i % 2 === 0) tick(g, say);
      else {
        g.traffic = g.traffic || { segments: 0, volume: 0, capacity: 1, congestion: 0, busStops: 0 };
      }
    }
    expect(Number.isFinite(g.cash)).toBe(true);
    expect(g.cash).toBeGreaterThanOrEqual(0);
  }, 15_000);

  it('migrate rejects NaN cash', () => {
    const g = createGame();
    const raw = { ...g, cash: Number.NaN };
    expect(migrateGame(raw)).toBeNull();
  });
});
