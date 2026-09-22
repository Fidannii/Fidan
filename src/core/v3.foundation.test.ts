import { describe, expect, it, beforeEach } from 'vitest';
import { SeededRng, SimulationClock, ensureRuntime, syncRuntimeToGame } from './clock';
import { createGame } from './world';
import { clearAllSaves, persistGame, loadGame, SAVE_VERSION, migrateGame } from './save';
import { place, tick, demolish } from './sim';
import { recomputeTrafficGraph, buildRoadGraph, shortestPath, markRoadsDirty } from './trafficGraph';
import { cmdCreateBusLine, tickBus, ensureBus } from './bus';
import { cmdSetTaxRate, cmdSetGameSpeed, cmdBuildRoad } from '../game/commands';
import { computeCitySim } from './systems';
import { SIZE } from './catalog';

describe('seeded rng + clock', () => {
  it('same seed produces same sequence', () => {
    const a = new SeededRng(42);
    const b = new SeededRng(42);
    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it('restore resumes count', () => {
    const a = new SeededRng(7);
    a.next();
    a.next();
    const b = new SeededRng(7);
    b.restore(7, 2);
    expect(a.next()).toBe(b.next());
  });

  it('simulation clock advances deterministically', () => {
    const c = new SimulationClock(0, '2x');
    c.advance(1000);
    expect(c.now()).toBe(1000);
    c.setSpeed('pause');
    expect(c.speed).toBe('pause');
  });
});

describe('deterministic command stream', () => {
  beforeEach(() => clearAllSaves());

  it('identical seed + commands => identical cash/built', () => {
    const run = () => {
      clearAllSaves();
      const g = createGame();
      g.seed = 12345;
      g.rngCount = 0;
      g.simTimeMs = 0;
      ensureRuntime(g);
      const say = () => {};
      const cx = Math.floor(g.size / 2);
      const cy = Math.floor(g.size / 2);
      // place roads outward
      place(g, cx + 3, cy, 'road', say);
      place(g, cx + 4, cy, 'road', say);
      syncRuntimeToGame(g);
      return { cash: g.cash, built: g.built, seed: g.seed, rng: g.rngCount };
    };
    expect(run()).toEqual(run());
  });
});

describe('save v8', () => {
  beforeEach(() => clearAllSaves());

  it('persists seed and taxRate', () => {
    const g = createGame();
    g.seed = 99;
    g.taxRate = 1.2;
    g.simTimeMs = 5000;
    g.gameSpeed = '2x';
    ensureRuntime(g);
    syncRuntimeToGame(g);
    persistGame(g);
    const loaded = loadGame();
    expect(loaded.game.saveVersion).toBe(SAVE_VERSION);
    expect(loaded.game.seed).toBe(99);
    expect(loaded.game.taxRate).toBeCloseTo(1.2);
    expect(loaded.game.simTimeMs).toBe(5000);
  });

  it('migrates v7-shaped object to v8', () => {
    const g = createGame();
    const raw = { ...g, saveVersion: 7 } as Record<string, unknown>;
    delete raw.seed;
    delete raw.busLines;
    delete raw.taxRate;
    const m = migrateGame(raw);
    expect(m).toBeTruthy();
    expect(m!.saveVersion).toBe(8);
    expect(m!.seed).toBeTypeOf('number');
    expect(m!.busLines).toEqual([]);
    expect(m!.taxRate).toBe(1);
  });

  it('recovers when primary corrupt and never invents empty city if backup ok', () => {
    const g = createGame();
    g.cash = 7777;
    persistGame(g);
    localStorage.setItem('metrobuilder-save-v5', 'NOT_JSON');
    const loaded = loadGame();
    expect(loaded.game.cash).toBe(7777);
    expect(loaded.recovered || loaded.source !== 'new').toBe(true);
  });
});

describe('economy guards', () => {
  it('computeCitySim has finite cashflow and bounded demand', () => {
    const g = createGame();
    ensureRuntime(g);
    const sim = computeCitySim(g);
    expect(Number.isFinite(sim.cashflow.net)).toBe(true);
    expect(Number.isFinite(sim.pop)).toBe(true);
    expect(sim.demand.residential).toBeGreaterThanOrEqual(-100);
    expect(sim.demand.residential).toBeLessThanOrEqual(100);
    expect(sim.cashflow.roads).toBeGreaterThanOrEqual(0);
  });

  it('tax rate command clamps', () => {
    const g = createGame();
    const say = () => {};
    expect(cmdSetTaxRate(g, 9, say).ok).toBe(true);
    expect(g.taxRate).toBe(1.5);
    expect(cmdSetTaxRate(g, 0.1, say).ok).toBe(true);
    expect(g.taxRate).toBe(0.5);
  });
});

describe('traffic graph v2', () => {
  beforeEach(() => clearAllSaves());

  it('builds nodes/edges for starter roads', () => {
    const g = createGame();
    const { nodes, edges } = buildRoadGraph(g);
    expect(nodes.length).toBeGreaterThan(0);
    expect(edges.length).toBeGreaterThan(0);
  });

  it('shortestPath finds a route on connected roads', () => {
    const g = createGame();
    const { nodes, edges } = buildRoadGraph(g);
    const a = nodes[0]!;
    const b = nodes[Math.min(3, nodes.length - 1)]!;
    const sp = shortestPath(nodes, edges, a.id, b.id);
    expect(sp).toBeTruthy();
  });

  it('recompute sets congestion and marks dirty clear', () => {
    const g = createGame();
    markRoadsDirty(g);
    const snap = recomputeTrafficGraph(g);
    expect(g.roadsDirty).toBe(false);
    expect(snap.nodeCount ?? snap.nodes.length).toBeGreaterThan(0);
    expect(g.trafficGraph?.edgeCount).toBeGreaterThan(0);
  });

  it('empty graph when no roads', () => {
    const g = createGame();
    for (const c of g.cells) {
      if (c.b && (c.b.id === 'road' || c.b.id === 'highway')) c.b = null;
    }
    markRoadsDirty(g);
    const snap = recomputeTrafficGraph(g);
    expect(snap.nodes.length).toBe(0);
    expect(snap.avgCongestion).toBe(0);
  });
});

describe('bus vertical slice', () => {
  beforeEach(() => clearAllSaves());

  it('rejects line without depot', () => {
    const g = createGame();
    ensureBus(g);
    const r = cmdCreateBusLine(g, 'A', [{ x: 1, y: 1 }, { x: 2, y: 2 }], () => {});
    expect(r.ok).toBe(false);
  });

  it('creates line with depot + stations and ticks ridership', () => {
    const g = createGame();
    const say = () => {};
    const cx = Math.floor(SIZE / 2);
    const cy = Math.floor(SIZE / 2);
    // ensure road path then depot/station on grass near road
    place(g, cx + 2, cy + 1, 'depot', say);
    place(g, cx - 2, cy + 1, 'station', say);
    // may fail if no road adjacency — force tiles
    const depot = g.cells.find((c) => c.b?.id === 'depot');
    const station = g.cells.find((c) => c.b?.id === 'station');
    if (!depot) {
      const c = g.cells.find((t) => t.x === cx + 1 && t.y === cy + 1)!;
      c.b = { id: 'depot', level: 1, jobAt: null, ready: 0, wear: 0 };
    }
    if (!station) {
      const c = g.cells.find((t) => t.x === cx - 1 && t.y === cy + 1)!;
      c.b = { id: 'station', level: 1, jobAt: null, ready: 0, wear: 0 };
    }
    const d = g.cells.find((c) => c.b?.id === 'depot')!;
    const s = g.cells.find((c) => c.b?.id === 'station')!;
    const r = cmdCreateBusLine(g, 'Linie 1', [{ x: d.x, y: d.y }, { x: s.x, y: s.y }], say);
    expect(r.ok).toBe(true);
    const tick = tickBus(g, 40, 0.4);
    expect(tick.cost).toBeGreaterThan(0);
    expect(tick.ridership).toBeGreaterThan(0);
    expect(g.busRidership).toBe(tick.ridership);
  });

  it('rejects single stop', () => {
    const g = createGame();
    const c = g.cells.find((t) => t.terrain === 'grass' && !t.b)!;
    c.b = { id: 'depot', level: 1, jobAt: null, ready: 0, wear: 0 };
    const r = cmdCreateBusLine(g, 'X', [{ x: c.x, y: c.y }], () => {});
    expect(r.ok).toBe(false);
  });
});

describe('commands + speed', () => {
  it('set game speed', () => {
    const g = createGame();
    ensureRuntime(g);
    expect(cmdSetGameSpeed(g, '4x', () => {}).ok).toBe(true);
    expect(g.gameSpeed).toBe('4x');
  });

  it('build road command marks dirty', () => {
    const g = createGame();
    ensureRuntime(g);
    g.roadsDirty = false;
    const cx = Math.floor(g.size / 2);
    const cy = Math.floor(g.size / 2);
    // find empty grass next to road
    const spot = g.cells.find(
      (c) => !c.b && c.terrain === 'grass' && Math.abs(c.x - cx) + Math.abs(c.y - cy) === 3,
    );
    if (spot) {
      cmdBuildRoad(g, spot.x, spot.y, () => {});
      expect(g.roadsDirty).toBe(true);
    }
  });
});

describe('stress ticks', () => {
  it('1000 ticks stay finite', () => {
    const g = createGame();
    const rt = ensureRuntime(g);
    const say = () => {};
    for (let i = 0; i < 1000; i++) {
      rt.clock.advance(100);
      g.simTimeMs = rt.clock.simTimeMs;
      tick(g, say);
    }
    expect(Number.isFinite(g.cash)).toBe(true);
    expect(g.cash).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(g.simTimeMs!)).toBe(true);
  });

  it('10 seeds × 400 ticks stay finite (RC soak)', () => {
    const seeds = [1, 7, 42, 99, 256, 1024, 4096, 7777, 12345, 99991];
    for (const seed of seeds) {
      const g = createGame();
      g.seed = seed >>> 0;
      g.rngCount = 0;
      const rt = ensureRuntime(g);
      const say = () => {};
      for (let i = 0; i < 400; i++) {
        rt.clock.advance(250);
        g.simTimeMs = rt.clock.simTimeMs;
        tick(g, say);
      }
      expect(Number.isFinite(g.cash)).toBe(true);
      expect(g.cash).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(g.xp)).toBe(true);
      expect(g.level).toBeGreaterThanOrEqual(1);
      expect(g.level).toBeLessThanOrEqual(100);
      if (g.traffic) {
        expect(Number.isFinite(g.traffic.congestion)).toBe(true);
        expect(g.traffic.congestion).toBeGreaterThanOrEqual(0);
      }
    }
  }, 30_000);
});
