import type { Game, RegionId, Res } from '../../core/types';
import type { Say } from '../../core/sim';
import { switchRegion, tradeToRegion } from '../../core/sim';
import { setSpecialization, type SpecId } from '../../core/cityProgress';
import { resolveEvent } from '../../core/events';
import { err, ok, type CmdResult } from './result';
import { ensureRuntime, type GameSpeed } from '../../core/clock';

export function cmdSwitchCity(g: Game, id: RegionId, say: Say): CmdResult<Game> {
  const next = switchRegion(g, id, say);
  if (!next) return err('Stadtwechsel fehlgeschlagen.');
  return ok('Stadt gewechselt', next);
}

export function cmdTradeRegion(
  g: Game,
  to: RegionId,
  res: Res,
  amount: number,
  say: Say,
): CmdResult {
  return tradeToRegion(g, to, res, amount, say)
    ? ok('Handel ok')
    : err('Handel fehlgeschlagen.');
}

export function cmdSetSpecialization(g: Game, id: SpecId, say: Say): CmdResult {
  return setSpecialization(g, id, say) ? ok('Spec gesetzt') : err('Spec nicht möglich.');
}

export function cmdAcceptEventChoice(
  g: Game,
  choice: 'invest' | 'ignore' | string,
  say: Say,
): CmdResult {
  // Events V2 maps invest/ignore plus named choice ids
  const mapped = choice === 'a' || choice === 'invest' ? 'invest' : choice === 'b' || choice === 'ignore' ? 'ignore' : choice;
  if (mapped !== 'invest' && mapped !== 'ignore' && mapped !== 'c') {
    return err('Ungültige Choice.');
  }
  // resolveEvent currently invest|ignore; 'c' treated as ignore-path with different messaging in events v2
  const r = resolveEvent(g, mapped === 'invest' ? 'invest' : 'ignore', say);
  return r ? ok('Event entschieden') : err('Kein aktives Event / Choice abgelehnt.');
}

export function cmdSetGameSpeed(g: Game, speed: GameSpeed, say: Say): CmdResult {
  const rt = ensureRuntime(g);
  rt.clock.setSpeed(speed);
  g.gameSpeed = speed;
  say(`Tempo: ${speed}`);
  return ok(`speed ${speed}`);
}

export function cmdSetTaxRate(g: Game, rate: number, say: Say): CmdResult {
  const r = Math.max(0.5, Math.min(1.5, rate));
  g.taxRate = r;
  say(`Steuersatz: ${Math.round(r * 100)}%`);
  g.sim = undefined;
  return ok('Steuer gesetzt');
}
