/**
 * Phase 3 — aggregated traffic on the road graph (no per-car pathfinding).
 */

import type { Game } from './types';
import { isRoad } from './world';
import { ECO } from './systems';

export interface TrafficSnap {
  segments: number;
  volume: number;
  capacity: number;
  congestion: number; // 0–100
  busStops: number;
}

function roadCap(id: string): number {
  return id === 'highway' ? 24 : 10;
}

/** Traffic demand ≈ pop + jobs + industry buildings */
function demand(g: Game): number {
  let pop = 0;
  let jobs = 0;
  for (const c of g.cells) {
    if (!c.b) continue;
    if (c.b.id === 'house') pop += 4 * c.b.level;
    jobs += ECO[c.b.id].jobs;
  }
  return Math.max(0, pop * 0.35 + jobs * 0.25);
}

export function computeTraffic(g: Game): TrafficSnap {
  let capacity = 0;
  let segments = 0;
  let busStops = 0;
  for (const c of g.cells) {
    if (!c.b) continue;
    if (isRoad(c.b.id)) {
      segments++;
      capacity += roadCap(c.b.id) * (0.9 + c.b.level * 0.1);
    }
    if (c.b.id === 'station' || c.b.id === 'depot') busStops++;
  }
  // Buses reduce effective demand
  const vol = Math.max(0, demand(g) * (1 - Math.min(0.35, busStops * 0.08)));
  const congestion =
    capacity <= 0 ? (vol > 0 ? 100 : 0) : Math.min(100, Math.round((vol / capacity) * 100));
  return {
    segments,
    volume: Math.round(vol),
    capacity: Math.round(capacity),
    congestion,
    busStops,
  };
}

/** Congestion 0–1 at a road cell — prefers Traffic V2 edge data */
export function congestionAt(g: Game, x: number, y: number): number {
  const c = g.cells.find((t) => t.x === x && t.y === y);
  if (!c?.b || !isRoad(c.b.id)) return 0;
  if (g.trafficGraph?.edgeCongestion) {
    const id = `${x},${y}`;
    let sum = 0;
    let n = 0;
    for (const [eid, cong] of Object.entries(g.trafficGraph.edgeCongestion)) {
      if (eid.split('>').includes(id)) {
        sum += cong;
        n++;
      }
    }
    if (n) return Math.min(1, sum / n);
    return Math.min(1, g.trafficGraph.avgCongestion || 0);
  }
  const snap = g.traffic ?? computeTraffic(g);
  const base = snap.congestion / 100;
  const boost = c.b.id === 'highway' ? 0.65 : 1;
  return Math.min(1, base * boost);
}

export function trafficColor(cong: number): string {
  if (cong < 0.35) return `rgba(80,200,120,${0.2 + cong * 0.3})`;
  if (cong < 0.65) return `rgba(240,200,60,${0.25 + cong * 0.35})`;
  return `rgba(240,80,60,${0.3 + cong * 0.4})`;
}
