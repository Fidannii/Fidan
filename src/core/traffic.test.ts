import { describe, expect, it, beforeEach } from 'vitest';
import { createGame } from './world';
import { computeTraffic, congestionAt, trafficColor } from './traffic';
import { clearAllSaves } from './save';

describe('traffic aggregation', () => {
  beforeEach(() => clearAllSaves());

  it('starter city has road capacity and finite congestion', () => {
    const g = createGame();
    const snap = computeTraffic(g);
    expect(snap.segments).toBeGreaterThan(0);
    expect(snap.capacity).toBeGreaterThan(0);
    expect(snap.congestion).toBeGreaterThanOrEqual(0);
    expect(snap.congestion).toBeLessThanOrEqual(100);
    expect(Number.isFinite(snap.volume)).toBe(true);
  });

  it('highways add more capacity than roads', () => {
    const g = createGame();
    const before = computeTraffic(g).capacity;
    const cx = Math.floor(g.size / 2);
    const cy = Math.floor(g.size / 2);
    const cell = g.cells.find((c) => c.x === cx && c.y === cy + 2 && !c.b && c.terrain !== 'void');
    if (cell) {
      cell.b = { id: 'highway', level: 1, stock: 0, ready: 0, jobAt: null };
      const after = computeTraffic(g).capacity;
      expect(after).toBeGreaterThan(before);
    } else {
      expect(before).toBeGreaterThan(0);
    }
  });

  it('congestionAt is 0 off-road and in [0,1] on road', () => {
    const g = createGame();
    g.traffic = computeTraffic(g);
    const road = g.cells.find((c) => c.b && (c.b.id === 'road' || c.b.id === 'highway'));
    expect(road).toBeTruthy();
    if (road) {
      const c = congestionAt(g, road.x, road.y);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
    expect(congestionAt(g, 0, 0)).toBe(0);
  });

  it('trafficColor returns rgba strings by band', () => {
    expect(trafficColor(0.1)).toMatch(/^rgba\(/);
    expect(trafficColor(0.5)).toMatch(/^rgba\(/);
    expect(trafficColor(0.9)).toMatch(/^rgba\(/);
  });
});
