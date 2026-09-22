/**
 * Thin app bootstrap helpers — keeps main.ts from owning runtime attach logic alone.
 */
import type { Game } from '../core/types';
import { ensureRuntime, syncRuntimeToGame } from '../core/clock';
import { ensureEvents } from '../core/events';
import { ensureCities } from '../core/cities';
import { ensureBus } from '../core/bus';
import { ensureProgression } from '../core/cityProgress';
import { ensureMeta } from '../core/meta';

export function bootstrapGame(g: Game) {
  ensureMeta(g);
  ensureProgression(g);
  ensureEvents(g);
  ensureCities(g);
  ensureBus(g);
  ensureRuntime(g);
  syncRuntimeToGame(g);
  return g;
}
