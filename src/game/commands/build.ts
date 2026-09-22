import type { BuildId, Game } from '../../core/types';
import type { Say } from '../../core/sim';
import { place as placeImpl, demolish as demolishImpl, canPlace } from '../../core/sim';
import { upgradeHouse, upgradeService } from '../../core/sim';
import { err, ok, type CmdResult } from './result';
import { markRoadsDirty } from '../../core/trafficGraph';

export function cmdBuildBuilding(
  g: Game,
  x: number,
  y: number,
  id: BuildId,
  say: Say,
): CmdResult {
  const pre = canPlace(g, x, y, id);
  if (pre) {
    say(pre);
    return err(pre);
  }
  const success = placeImpl(g, x, y, id, say);
  if (!success) return err('Bauen fehlgeschlagen.');
  if (id === 'road' || id === 'highway' || id === 'station' || id === 'depot') {
    markRoadsDirty(g);
  }
  return ok(`${id} gebaut`);
}

export function cmdBuildRoad(g: Game, x: number, y: number, say: Say, highway = false): CmdResult {
  return cmdBuildBuilding(g, x, y, highway ? 'highway' : 'road', say);
}

export function cmdDemolish(g: Game, x: number, y: number, say: Say): CmdResult {
  const before = g.cells.find((c) => c.x === x && c.y === y)?.b?.id;
  demolishImpl(g, x, y, say);
  if (before === 'road' || before === 'highway' || before === 'station' || before === 'depot') {
    markRoadsDirty(g);
  }
  return ok('Abgerissen');
}

export function cmdUpgradeBuilding(g: Game, x: number, y: number, say: Say): CmdResult {
  const c = g.cells.find((t) => t.x === x && t.y === y);
  if (!c?.b) return err('Nichts zum Upgraden.');
  if (c.b.id === 'house') {
    const r = upgradeHouse(g, x, y, say);
    return r ? ok('Haus upgegradet') : err('Upgrade fehlgeschlagen.');
  }
  upgradeService(g, x, y, say);
  return ok('Service upgegradet');
}
