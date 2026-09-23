/**
 * Bus vertical slice — one complete line system (stops, depot, capacity, cost, ridership).
 */

import type { Game } from './types';
import { cell } from './world';
import { err, ok, type CmdResult } from '../game/commands/result';
import type { Say } from './sim';

export interface BusStopRef {
  x: number;
  y: number;
}

export interface BusLine {
  id: string;
  name: string;
  stopOrder: BusStopRef[];
  frequency: number; // departures per sim-minute equiv (abstract)
  capacity: number;
  operatingCost: number; // per tax period
  ridership: number;
  active: boolean;
}

function hasDepotBuilding(g: Game): boolean {
  return g.cells.some((c) => c.b?.id === 'depot');
}

function isStopTile(g: Game, x: number, y: number): boolean {
  const c = cell(g, x, y);
  return !!c?.b && (c.b.id === 'station' || c.b.id === 'depot');
}

export function ensureBus(g: Game) {
  if (!g.busLines) g.busLines = [];
  if (g.busRidership == null) g.busRidership = 0;
}

export function cmdCreateBusLine(
  g: Game,
  name: string,
  stops: BusStopRef[],
  say: Say,
): CmdResult<BusLine> {
  ensureBus(g);
  if (!hasDepotBuilding(g)) {
    const m = 'Buslinie braucht ein Depot in der Stadt.';
    say(m);
    return err(m);
  }
  const cleaned: BusStopRef[] = [];
  const seen = new Set<string>();
  for (const s of stops) {
    const k = `${s.x},${s.y}`;
    if (seen.has(k)) continue;
    seen.add(k);
    if (!isStopTile(g, s.x, s.y)) {
      const m = `Kein Halt bei ${s.x},${s.y} (Station/Depot nötig).`;
      say(m);
      return err(m);
    }
    cleaned.push({ x: s.x, y: s.y });
  }
  if (cleaned.length < 2) {
    const m = 'Mindestens 2 Haltestellen nötig.';
    say(m);
    return err(m);
  }
  const line: BusLine = {
    id: `bus-${(g.seed || 1).toString(36)}-${g.busLines!.length}-${(g.simTimeMs || 0).toString(36)}`,
    name: name || `Linie ${g.busLines!.length + 1}`,
    stopOrder: cleaned,
    frequency: 4,
    capacity: 40,
    operatingCost: 12 + cleaned.length * 4,
    ridership: 0,
    active: true,
  };
  g.busLines!.push(line);
  say(`Buslinie „${line.name}“ angelegt (${cleaned.length} Stops).`);
  return ok('Linie erstellt', line);
}

export function cmdDeleteBusLine(g: Game, id: string, say: Say): CmdResult {
  ensureBus(g);
  const i = g.busLines!.findIndex((l) => l.id === id);
  if (i < 0) return err('Linie nicht gefunden.');
  const [rm] = g.busLines!.splice(i, 1);
  say(`Linie „${rm.name}“ entfernt.`);
  return ok('entfernt');
}

/** Update ridership from demand proxy; returns total riders + operating cost */
export function tickBus(g: Game, pop: number, congestion: number): {
  ridership: number;
  cost: number;
} {
  ensureBus(g);
  let riders = 0;
  let cost = 0;
  const depotOk = hasDepotBuilding(g);
  for (const line of g.busLines!) {
    if (!depotOk || line.stopOrder.length < 2) {
      line.active = false;
      line.ridership = 0;
      continue;
    }
    line.active = true;
    cost += line.operatingCost;
    const potential = Math.min(
      line.capacity * line.frequency,
      Math.max(0, pop * 0.08 * line.stopOrder.length + congestion * 20),
    );
    line.ridership = Math.round(potential);
    riders += line.ridership;
  }
  g.busRidership = riders;
  return { ridership: riders, cost };
}

export function busLinesSummary(g: Game): string {
  ensureBus(g);
  if (!g.busLines!.length) return 'Keine Buslinien.';
  return g.busLines!.map((l) => `${l.active ? '🟢' : '⏸'} ${l.name}: ${l.ridership}/${l.capacity * l.frequency} · −${l.operatingCost}¢`).join('\n');
}
