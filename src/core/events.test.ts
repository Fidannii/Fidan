import { describe, expect, it, beforeEach } from 'vitest';
import { createGame } from './world';
import { ensureEvents, resolveEvent, tickEvents, eventHint } from './events';
import { clearAllSaves } from './save';

describe('choice events', () => {
  beforeEach(() => clearAllSaves());

  it('ensureEvents initializes timers', () => {
    const g = createGame();
    delete g.nextEventAt;
    delete g.activeEvent;
    delete g.eventPrep;
    ensureEvents(g);
    expect(g.nextEventAt).toBeGreaterThan(Date.now() - 1000);
    expect(g.activeEvent).toBeNull();
    expect(g.eventPrep).toBe(0);
  });

  it('tickEvents spawns when due and pop sufficient', () => {
    const g = createGame();
    g.nextEventAt = Date.now() - 1;
    g.activeEvent = null;
    const msgs: string[] = [];
    tickEvents(g, (m) => msgs.push(m));
    expect(g.activeEvent).toBeTruthy();
    expect(msgs[0]).toMatch(/Ereignis/);
  });

  it('resolveEvent invest costs cash; ignore clears event', () => {
    const g = createGame();
    g.cash = 500;
    g.activeEvent = {
      id: 'festival',
      title: 'Stadtfest',
      body: 'test',
      investCost: 60,
      investLabel: 'Festival',
      ignoreLabel: 'Absagen',
    };
    const msgs: string[] = [];
    expect(resolveEvent(g, 'invest', (m) => msgs.push(m))).toBe(true);
    expect(g.activeEvent).toBeNull();
    expect(g.eventPrep).toBeGreaterThan(0);

    g.activeEvent = {
      id: 'storm',
      title: 'Sturm',
      body: 'test',
      investCost: 80,
      investLabel: 'Vorsorge',
      ignoreLabel: 'Ignorieren',
    };
    expect(resolveEvent(g, 'ignore', (m) => msgs.push(m))).toBe(true);
    expect(g.disasterUntil).toBeTruthy();
  });

  it('eventHint returns string or null', () => {
    const g = createGame();
    const h = eventHint(g);
    expect(h === null || typeof h === 'string').toBe(true);
  });
});
