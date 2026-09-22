/**
 * Deterministic clocks + seeded RNG for gameplay.
 * Visual-only effects may still use Math.random()/Date.now().
 */

export type GameSpeed = 'pause' | '1x' | '2x' | '4x';

export const SPEED_MULT: Record<GameSpeed, number> = {
  pause: 0,
  '1x': 1,
  '2x': 2,
  '4x': 4,
};

/** Mulberry32 — small, deterministic, serializable via seed + counter */
export class SeededRng {
  private state: number;
  private _count = 0;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  get seed(): number {
    return this.state;
  }

  get count(): number {
    return this._count;
  }

  /** Restore after load */
  restore(seed: number, count: number) {
    this.state = seed >>> 0 || 1;
    this._count = 0;
    for (let i = 0; i < count; i++) this.next();
    this._count = count;
  }

  next(): number {
    this._count++;
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) return 0;
    return Math.floor(this.next() * maxExclusive);
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.nextInt(arr.length)]!;
  }
}

export class SimulationClock {
  /** Simulated milliseconds since game start (or migrated epoch). */
  simTimeMs = 0;
  speed: GameSpeed = '1x';
  /** Wall-clock anchor for advancing sim between frames (not persisted). */
  private lastWall = 0;

  constructor(simTimeMs = 0, speed: GameSpeed = '1x') {
    this.simTimeMs = simTimeMs;
    this.speed = speed;
  }

  now(): number {
    return this.simTimeMs;
  }

  setSpeed(s: GameSpeed) {
    this.speed = s;
  }

  /** Advance simulation using wall delta; call once per frame/tick. */
  advanceFromWall(wallNow: number): number {
    if (!this.lastWall) {
      this.lastWall = wallNow;
      return 0;
    }
    const wallDt = Math.max(0, Math.min(250, wallNow - this.lastWall));
    this.lastWall = wallNow;
    const dt = wallDt * SPEED_MULT[this.speed];
    this.simTimeMs += dt;
    return dt;
  }

  /** Deterministic advance (tests / command streams). */
  advance(ms: number) {
    this.simTimeMs += Math.max(0, ms);
  }
}

export function createSeed(): number {
  // Only for NEW games — not used mid-simulation
  return (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0;
}

/** Per-game runtime handles (not always on Game object itself). */
export interface RuntimeClocks {
  rng: SeededRng;
  clock: SimulationClock;
}

const runtimes = new WeakMap<object, RuntimeClocks>();

export function attachRuntime(g: object, seed: number, simTimeMs: number, speed: GameSpeed): RuntimeClocks {
  const rng = new SeededRng(seed);
  const clock = new SimulationClock(simTimeMs, speed);
  const rt = { rng, clock };
  runtimes.set(g, rt);
  return rt;
}

export function getRuntime(g: object): RuntimeClocks | null {
  return runtimes.get(g) ?? null;
}

export function ensureRuntime(
  g: {
    seed?: number;
    rngCount?: number;
    simTimeMs?: number;
    gameSpeed?: GameSpeed;
  },
): RuntimeClocks {
  let rt = runtimes.get(g);
  if (rt) return rt;
  const seed = g.seed ?? createSeed();
  g.seed = seed;
  if (g.simTimeMs == null) g.simTimeMs = 0;
  if (!g.gameSpeed) g.gameSpeed = '1x';
  rt = attachRuntime(g, seed, g.simTimeMs, g.gameSpeed);
  if (g.rngCount && g.rngCount > 0) {
    rt.rng.restore(seed, g.rngCount);
  }
  return rt;
}

export function syncRuntimeToGame(g: {
  seed?: number;
  rngCount?: number;
  simTimeMs?: number;
  gameSpeed?: GameSpeed;
}) {
  const rt = ensureRuntime(g);
  g.seed = rt.rng.seed;
  g.rngCount = rt.rng.count;
  g.simTimeMs = rt.clock.simTimeMs;
  g.gameSpeed = rt.clock.speed;
}

export function nowOf(g: object, fallback = Date.now()): number {
  const rt = getRuntime(g);
  return rt ? rt.clock.now() : fallback;
}

export function rngOf(g: object): SeededRng {
  return ensureRuntime(g as { seed?: number }).rng;
}
