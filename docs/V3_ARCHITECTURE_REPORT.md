# MetroBuilder — V3 Architecture Report

## Goals achieved (this pass)

1. **Command layer** under `src/game/commands/` (`build`, `economy`, `result`, `index`)
2. **Deterministic runtime** `src/core/clock.ts` (SeededRng, SimulationClock, GameSpeed)
3. **Bootstrap helper** `src/app/bootstrap.ts`
4. **Traffic V2 graph** `src/core/trafficGraph.ts` (nodes/edges/trips/routing/cache)
5. **Bus vertical slice** `src/core/bus.ts`
6. **Events V2** delayed effects + weighted seeded picks in `src/core/events.ts`
7. **Growth hysteresis** `src/core/growth.ts`
8. **Cloud provider interface** `src/core/cloudSave.ts` (stub implementation only)

## Data flow (target)

```
UI (main.ts panels)
  → Command (cmd*)
    → Game state / Simulation (sim, systems, trafficGraph, bus, events)
      → persisted Save v8
        → Renderer (view.ts)
```

## main.ts status

| Metric | PRE-V3 | Now |
|--------|-------:|----:|
| Lines | 1172 | ~1225 |

**Honest note:** Line count did not shrink because tax/speed/bus UI was added in-panel.  
**Responsibility split improved:** place/demolish/upgrade/spec/event/city/tax/speed go through commands; sim tick owns clock/graph/bus/events.

Further extractions panels (`src/ui/panels/*`) remain a next-phase item — not forced as a big-bang rewrite.

## Save

- Envelope version **8**
- New fields: seed, rngCount, simTimeMs, gameSpeed, taxRate, busLines, trafficGraph meta, pendingEffects, eventCooldowns
- Explicit v7→v8 migration with wall-clock continuity for timers

## Non-goals respected

- No Bundle-ID change (`com.fidani.metrobuilder`)
- No rewrite of systems from scratch
- No multiplayer / tram / metro
- No real IAP purchases triggered
