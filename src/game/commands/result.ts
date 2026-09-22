/**
 * Gameplay command results — UI calls commands; commands mutate game state.
 */

export type CmdOk<T = void> = { ok: true; data?: T; message?: string };
export type CmdErr = { ok: false; error: string };
export type CmdResult<T = void> = CmdOk<T> | CmdErr;

export function ok<T = void>(message?: string, data?: T): CmdOk<T> {
  return data !== undefined ? { ok: true, message, data } : { ok: true, message };
}

export function err(error: string): CmdErr {
  return { ok: false, error };
}
