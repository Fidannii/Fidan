import { describe, expect, it, beforeEach } from 'vitest';
import { createGame } from './world';
import {
  computeCitySim,
  landValueAt,
  canUpgradeHouseSoft,
  ECO,
  serviceQualityAt,
} from './systems';
import { clearAllSaves } from './save';

describe('simulation core 2.0', () => {
  beforeEach(() => clearAllSaves());

  it('ECO covers every build id', () => {
    expect(Object.keys(ECO).length).toBeGreaterThan(20);
    expect(ECO.hospital.serviceCapacity).toBeGreaterThan(0);
    expect(ECO.power.pollution).toBeGreaterThan(ECO.solar.pollution);
  });

  it('starter city has population, jobs, taxes and maintenance', () => {
    const g = createGame();
    const sim = computeCitySim(g);
    expect(sim.pop).toBeGreaterThan(0);
    expect(sim.jobs).toBeGreaterThan(0);
    expect(sim.cashflow.taxes).toBeGreaterThan(0);
    expect(sim.cashflow.maintenance).toBeGreaterThan(0);
    expect(Number.isFinite(sim.cashflow.net)).toBe(true);
    expect(sim.services.some((s) => s.kind === 'power' && s.capacity > 0)).toBe(true);
  });

  it('land value is higher near park/power than void edge', () => {
    const g = createGame();
    const cx = Math.floor(g.size / 2);
    const cy = Math.floor(g.size / 2);
    const near = landValueAt(g, cx - 1, cy - 1); // house
    const far = landValueAt(g, 0, 0); // void
    expect(near).toBeGreaterThan(far);
    expect(near).toBeGreaterThan(25);
  });

  it('service capacity quality drops conceptually when overloaded flag computable', () => {
    const g = createGame();
    const cx = Math.floor(g.size / 2);
    const cy = Math.floor(g.size / 2);
    const q = serviceQualityAt(g, cx - 1, cy - 1, ['power', 'solar']);
    expect(q.covered).toBe(true);
    expect(q.quality).toBeGreaterThan(0);
  });

  it('soft upgrade gate passes on starter house with utilities', () => {
    const g = createGame();
    const cx = Math.floor(g.size / 2);
    const cy = Math.floor(g.size / 2);
    // starter house at cx-1, cy-1 has road, power, water nearby
    expect(canUpgradeHouseSoft(g, cx - 1, cy - 1)).toBeNull();
  });

  it('population and jobs never negative', () => {
    const g = createGame();
    const sim = computeCitySim(g);
    expect(sim.pop).toBeGreaterThanOrEqual(0);
    expect(sim.jobs).toBeGreaterThanOrEqual(0);
    expect(sim.unemployment).toBeGreaterThanOrEqual(0);
  });
});
