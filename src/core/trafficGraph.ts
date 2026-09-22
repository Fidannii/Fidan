/**
 * Traffic V2 — road graph with edges, capacity, aggregated routing.
 * Complements (does not delete) the global computeTraffic snapshot.
 */

import type { Game } from './types';
import { isRoad } from './world';
import { ECO } from './systems';

export interface RoadNode {
  id: string;
  x: number;
  y: number;
  connections: string[]; // edge ids
}

export interface RoadEdge {
  id: string;
  from: string;
  to: string;
  length: number;
  roadType: 'road' | 'highway';
  speed: number;
  capacity: number;
  load: number;
  congestion: number; // 0–1
}

export interface TripGroup {
  id: string;
  fromNode: string;
  toNode: string;
  demand: number;
  kind: 'home_job' | 'home_shop' | 'industry' | 'service';
}

export interface TrafficGraphSnap {
  nodes: RoadNode[];
  edges: RoadEdge[];
  trips: TripGroup[];
  avgCongestion: number;
  avgTravelFactor: number; // 1 = free flow
  recomputeMs: number;
  version: number;
}

function nid(x: number, y: number): string {
  return `${x},${y}`;
}

function roadMeta(id: string): { speed: number; capacity: number; roadType: 'road' | 'highway' } {
  if (id === 'highway') return { speed: 2.2, capacity: 24, roadType: 'highway' };
  return { speed: 1, capacity: 10, roadType: 'road' };
}

const dirs = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function markRoadsDirty(g: Game) {
  g.roadsDirty = true;
  g.routeCache = undefined;
}

function cellMap(g: Game): Map<string, (typeof g.cells)[0]> {
  const m = new Map<string, (typeof g.cells)[0]>();
  for (const c of g.cells) m.set(nid(c.x, c.y), c);
  return m;
}

/** Build undirected road graph from cells */
export function buildRoadGraph(g: Game): { nodes: RoadNode[]; edges: RoadEdge[] } {
  const map = cellMap(g);
  const nodes: RoadNode[] = [];
  const nodeIndex = new Map<string, RoadNode>();
  for (const c of g.cells) {
    if (!c.b || !isRoad(c.b.id)) continue;
    const id = nid(c.x, c.y);
    const n: RoadNode = { id, x: c.x, y: c.y, connections: [] };
    nodes.push(n);
    nodeIndex.set(id, n);
  }
  const edges: RoadEdge[] = [];
  const seen = new Set<string>();
  for (const n of nodes) {
    for (const [dx, dy] of dirs) {
      const oid = nid(n.x + dx, n.y + dy);
      if (!nodeIndex.has(oid)) continue;
      const a = n.id < oid ? n.id : oid;
      const b = n.id < oid ? oid : n.id;
      const ek = `${a}>${b}`;
      if (seen.has(ek)) continue;
      seen.add(ek);
      const cell = map.get(n.id)!;
      const meta = roadMeta(cell.b!.id);
      const e: RoadEdge = {
        id: ek,
        from: a,
        to: b,
        length: 1,
        roadType: meta.roadType,
        speed: meta.speed,
        capacity: meta.capacity * (0.9 + (cell.b!.level || 1) * 0.1),
        load: 0,
        congestion: 0,
      };
      edges.push(e);
      nodeIndex.get(a)!.connections.push(e.id);
      nodeIndex.get(b)!.connections.push(e.id);
    }
  }
  return { nodes, edges };
}

function nearestRoadNode(
  nodes: RoadNode[],
  x: number,
  y: number,
): RoadNode | null {
  let best: RoadNode | null = null;
  let bestD = Infinity;
  for (const n of nodes) {
    const d = Math.abs(n.x - x) + Math.abs(n.y - y);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return bestD <= 4 ? best : null;
}

/** Dijkstra with travel time weight = length/speed * (1+congestion) */
export function shortestPath(
  nodes: RoadNode[],
  edges: RoadEdge[],
  from: string,
  to: string,
): { edgeIds: string[]; cost: number } | null {
  if (from === to) return { edgeIds: [], cost: 0 };
  const adj = new Map<string, RoadEdge[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.from)?.push(e);
    adj.get(e.to)?.push(e);
  }
  const dist = new Map<string, number>();
  const prev = new Map<string, { node: string; edge: string }>();
  const pq: Array<{ id: string; d: number }> = [{ id: from, d: 0 }];
  dist.set(from, 0);
  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const cur = pq.shift()!;
    if (cur.id === to) break;
    if (cur.d !== dist.get(cur.id)) continue;
    for (const e of adj.get(cur.id) || []) {
      const other = e.from === cur.id ? e.to : e.from;
      const w = (e.length / Math.max(0.2, e.speed)) * (1 + e.congestion);
      const nd = cur.d + w;
      if (nd < (dist.get(other) ?? Infinity)) {
        dist.set(other, nd);
        prev.set(other, { node: cur.id, edge: e.id });
        pq.push({ id: other, d: nd });
      }
    }
  }
  if (!dist.has(to)) return null;
  const edgeIds: string[] = [];
  let walk: string | undefined = to;
  while (walk && walk !== from) {
    const p = prev.get(walk);
    if (!p) break;
    edgeIds.push(p.edge);
    walk = p.node;
  }
  edgeIds.reverse();
  return { edgeIds, cost: dist.get(to)! };
}

function buildTrips(g: Game, nodes: RoadNode[]): TripGroup[] {
  if (!nodes.length) return [];
  const homes: Array<{ x: number; y: number; w: number }> = [];
  const jobs: Array<{ x: number; y: number; w: number }> = [];
  const shops: Array<{ x: number; y: number; w: number }> = [];
  for (const c of g.cells) {
    if (!c.b) continue;
    if (c.b.id === 'house') homes.push({ x: c.x, y: c.y, w: 4 * c.b.level });
    const jobsN = ECO[c.b.id]?.jobs ?? 0;
    if (jobsN > 0) jobs.push({ x: c.x, y: c.y, w: jobsN });
    if (['cinema', 'stadium', 'landmark', 'park'].includes(c.b.id)) {
      shops.push({ x: c.x, y: c.y, w: 3 });
    }
  }
  const trips: TripGroup[] = [];
  const take = <T>(arr: T[], n: number) => arr.slice(0, n);
  for (const h of take(homes, 24)) {
    const hn = nearestRoadNode(nodes, h.x, h.y);
    if (!hn) continue;
    const j = jobs[Math.abs(h.x * 13 + h.y * 7) % Math.max(1, jobs.length)];
    if (j) {
      const jn = nearestRoadNode(nodes, j.x, j.y);
      if (jn && jn.id !== hn.id) {
        trips.push({
          id: `hj-${hn.id}-${jn.id}`,
          fromNode: hn.id,
          toNode: jn.id,
          demand: Math.max(1, h.w * 0.35),
          kind: 'home_job',
        });
      }
    }
    if (shops.length) {
      const s = shops[Math.abs(h.x + h.y) % shops.length]!;
      const sn = nearestRoadNode(nodes, s.x, s.y);
      if (sn && sn.id !== hn.id) {
        trips.push({
          id: `hs-${hn.id}-${sn.id}`,
          fromNode: hn.id,
          toNode: sn.id,
          demand: Math.max(0.5, h.w * 0.12),
          kind: 'home_shop',
        });
      }
    }
  }
  return trips;
}

/**
 * Recompute graph loads. Uses route cache when roads not dirty.
 * Bus ridership (g.busRidership) reduces auto demand.
 */
export function recomputeTrafficGraph(g: Game): TrafficGraphSnap {
  const t0 =
    typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  const { nodes, edges } = buildRoadGraph(g);
  const edgeById = new Map(edges.map((e) => [e.id, e]));
  let trips = buildTrips(g, nodes);
  const busRelief = Math.min(0.55, (g.busRidership || 0) / Math.max(1, trips.reduce((a, t) => a + t.demand, 0) || 1));
  if (busRelief > 0) {
    trips = trips.map((t) => ({ ...t, demand: t.demand * (1 - busRelief) }));
  }

  const cacheKey = `${nodes.length}:${edges.length}:${g.roadsDirty ? 'd' : 'c'}:${Math.round(busRelief * 100)}`;
  let routeCache = g.routeCache;
  if (g.roadsDirty || !routeCache || routeCache.key !== cacheKey) {
    routeCache = { key: cacheKey, routes: {} };
    g.roadsDirty = false;
  }

  for (const trip of trips) {
    const rk = `${trip.fromNode}>${trip.toNode}`;
    let route = routeCache.routes[rk];
    if (!route) {
      const sp = shortestPath(nodes, edges, trip.fromNode, trip.toNode);
      route = sp ? sp.edgeIds : [];
      routeCache.routes[rk] = route;
    }
    for (const eid of route) {
      const e = edgeById.get(eid);
      if (e) e.load += trip.demand;
    }
  }
  g.routeCache = routeCache;

  let congSum = 0;
  let travel = 0;
  for (const e of edges) {
    e.congestion = e.capacity <= 0 ? 1 : Math.min(1, e.load / e.capacity);
    congSum += e.congestion;
    travel += 1 + e.congestion;
  }
  const avgCongestion = edges.length ? congSum / edges.length : 0;
  const avgTravelFactor = edges.length ? travel / edges.length : 1;
  const t1 =
    typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  const snap: TrafficGraphSnap = {
    nodes,
    edges,
    trips,
    avgCongestion,
    avgTravelFactor,
    recomputeMs: Math.max(0, t1 - t0),
    version: (g.trafficGraph?.version || 0) + 1,
  };
  g.trafficGraph = {
    avgCongestion: snap.avgCongestion,
    avgTravelFactor: snap.avgTravelFactor,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    tripCount: trips.length,
    recomputeMs: snap.recomputeMs,
    version: snap.version,
    edgeCongestion: Object.fromEntries(edges.map((e) => [e.id, e.congestion])),
  };
  return snap;
}

export function edgeCongestionAt(g: Game, x: number, y: number): number {
  const tg = g.trafficGraph;
  if (!tg?.edgeCongestion) return 0;
  // average congestion of edges touching this node
  const id = nid(x, y);
  let sum = 0;
  let n = 0;
  for (const [eid, c] of Object.entries(tg.edgeCongestion)) {
    if (eid.startsWith(id + '>') || eid.endsWith('>' + id) || eid.includes(`>${id}`) || eid.startsWith(`${id}`)) {
      // edges are "a>b" sorted
      if (eid.split('>').includes(id)) {
        sum += c;
        n++;
      }
    }
  }
  return n ? sum / n : tg.avgCongestion || 0;
}
