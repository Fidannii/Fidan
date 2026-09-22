import { describe, expect, it, beforeEach } from 'vitest';
import { createGame } from './world';
import {
  cityTierOf,
  ensureProgression,
  setSpecialization,
  specModifiers,
  strategicGoals,
  SPECS,
} from './cityProgress';
import { clearAllSaves } from './save';

describe('city progression', () => {
  beforeEach(() => clearAllSaves());

  it('starter city is Dorf with progress toward Kleinstadt', () => {
    const g = createGame();
    const tier = cityTierOf(g);
    expect(tier.id).toBe('dorf');
    expect(tier.name).toBe('Dorf');
    expect(tier.next).toBe('Kleinstadt');
    expect(tier.progress).toBeGreaterThanOrEqual(0);
    expect(tier.progress).toBeLessThanOrEqual(100);
  });

  it('ensureProgression sets defaults', () => {
    const g = createGame();
    delete g.specialization;
    delete g.cityTier;
    ensureProgression(g);
    expect(g.specialization).toBe('none');
    expect(g.cityTier).toBe('dorf');
  });

  it('green specialization needs Kleinstadt; offen always ok', () => {
    const g = createGame();
    const msgs: string[] = [];
    const say = (m: string) => msgs.push(m);
    expect(setSpecialization(g, 'none', say)).toBe(true);
    expect(setSpecialization(g, 'green', say)).toBe(false);
    expect(msgs.some((m) => /Stadtstatus/.test(m))).toBe(true);
  });

  it('specModifiers differ by specialization', () => {
    const g = createGame();
    g.specialization = 'industry';
    g.cityTier = 'stadt';
    const ind = specModifiers(g);
    g.specialization = 'green';
    const gr = specModifiers(g);
    expect(ind.taxMult).toBeGreaterThan(gr.taxMult);
    expect(gr.happiness).toBeGreaterThan(ind.happiness);
    expect(SPECS.length).toBe(5);
  });

  it('strategicGoals returns four goals', () => {
    const g = createGame();
    const goals = strategicGoals(g, 50, 40);
    expect(goals).toHaveLength(4);
    expect(goals.every((x) => typeof x.done === 'boolean')).toBe(true);
  });
});
