/**
 * Soft building evolution / decay with hysteresis (not instant).
 */

import type { Game } from './types';
import { HOUSE } from './catalog';
import { landValueAt, canUpgradeHouseSoft, getSim } from './systems';
import { cell } from './world';

const PENDING = new WeakMap<object, Map<string, number>>();

function pendingMap(g: Game): Map<string, number> {
  let m = PENDING.get(g);
  if (!m) {
    m = new Map();
    PENDING.set(g, m);
  }
  return m;
}

/**
 * Houses may grow a level when conditions stay good for ~45s sim time,
 * or lose wear/level pressure when conditions stay bad.
 */
export function maybeEvolveHouses(g: Game, now: number) {
  const sim = getSim(g);
  const map = pendingMap(g);
  for (const c of g.cells) {
    if (c.b?.id !== 'house') continue;
    const key = `${c.x},${c.y}`;
    const lv = landValueAt(g, c.x, c.y);
    const soft = canUpgradeHouseSoft(g, c.x, c.y);
    const good = !soft && lv >= 40 && sim.sat >= 55 && (g.traffic?.congestion ?? 0) < 70;
    const bad = lv < 22 || sim.sat < 35 || (g.traffic?.congestion ?? 0) > 85;

    if (good && c.b.level < HOUSE.length) {
      const started = map.get(key);
      if (started == null) map.set(key, now);
      else if (now - started > 45_000) {
        c.b.level += 1;
        map.delete(key);
      }
    } else if (bad) {
      const started = map.get(`bad:${key}`);
      if (started == null) map.set(`bad:${key}`, now);
      else if (now - started > 60_000) {
        c.b.wear = Math.min(100, c.b.wear + 8);
        if (c.b.wear > 90 && c.b.level > 1) {
          c.b.level -= 1;
          c.b.wear = 40;
        }
        map.delete(`bad:${key}`);
      }
    } else {
      map.delete(key);
      map.delete(`bad:${key}`);
    }
  }
}

export function forceCheckHouse(g: Game, x: number, y: number) {
  return cell(g, x, y);
}
