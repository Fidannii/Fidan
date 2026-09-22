import { describe, expect, it, beforeEach } from 'vitest';
import { createGame } from './world';
import { ensureCities, switchCity, regionalTrade } from './cities';
import { clearAllSaves } from './save';

describe('persistent cities + regional trade', () => {
  beforeEach(() => clearAllSaves());

  it('ensureCities snapshots current region', () => {
    const g = createGame();
    ensureCities(g);
    expect(g.cities).toBeTruthy();
    expect(g.cities![g.region]).toBeTruthy();
    expect(g.cities![g.region]!.cells.length).toBe(g.cells.length);
  });

  it('switchCity persists map and creates new city', () => {
    const g = createGame();
    g.unlockedRegions = ['valley', 'coast'];
    g.cash = 5000;
    const msgs: string[] = [];
    const say = (m: string) => msgs.push(m);
    const next = switchCity(g, 'coast', say);
    expect(next).toBeTruthy();
    expect(next!.region).toBe('coast');
    expect(next!.cities!['valley']).toBeTruthy();
    expect(next!.cities!['coast']).toBeTruthy();
    expect(msgs.some((m) => /Neue Stadt|Willkommen/.test(m))).toBe(true);

    // switch back restores valley snapshot
    const back = switchCity(next!, 'valley', say);
    expect(back).toBeTruthy();
    expect(back!.region).toBe('valley');
  });

  it('switchCity rejects locked or same region', () => {
    const g = createGame();
    const msgs: string[] = [];
    const say = (m: string) => msgs.push(m);
    expect(switchCity(g, 'desert', say)).toBeNull();
    expect(switchCity(g, g.region, say)).toBeNull();
  });

  it('regionalTrade moves stock with fee', () => {
    const g = createGame();
    g.unlockedRegions = ['valley', 'coast'];
    g.cash = 5000;
    g.inv.wood = 5;
    const msgs: string[] = [];
    const say = (m: string) => msgs.push(m);
    const coast = switchCity(g, 'coast', say)!;
    // back to valley with coast saved
    const valley = switchCity(coast, 'valley', say)!;
    valley.inv.wood = 5;
    valley.cash = 5000;
    expect(regionalTrade(valley, 'coast', 'wood', 1, say)).toBe(true);
    expect(valley.inv.wood).toBe(4);
    expect(valley.cities!['coast']!.localInv.wood).toBeGreaterThanOrEqual(1);
  });
});
