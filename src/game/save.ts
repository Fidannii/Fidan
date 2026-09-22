import { SAVE_KEY } from './data';
import { createInitialState, type GameState } from './state';

export function saveGame(state: GameState) {
  try {
    const payload = JSON.stringify(state);
    localStorage.setItem(SAVE_KEY, payload);
  } catch {
    // ignore quota
  }
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as GameState;
    // Basic sanity
    if (!parsed.tiles?.length || !parsed.inventory) return createInitialState();
    parsed.selectedBuild = null;
    parsed.selectedTile = null;
    return parsed;
  } catch {
    return createInitialState();
  }
}

export function resetGame(): GameState {
  localStorage.removeItem(SAVE_KEY);
  return createInitialState();
}
