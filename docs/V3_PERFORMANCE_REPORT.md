# MetroBuilder — V3 Performance Report

## Metrics recorded on `Game.metrics`

| Field | Meaning |
|-------|---------|
| `lastTickMs` | Full `tick()` wall duration |
| `lastTrafficMs` | Graph recompute duration |
| `lastSaveMs` | Persist duration |

## Design choices

- Simulation advances via `SimulationClock.advanceFromWall` (capped dt)
- `PAUSE` skips sim work
- Traffic routes cached until `roadsDirty`
- No per-citizen simulation
- `getSim` still caches ~1.5s (wall) — acceptable for UI; graph recomputes each tick but route cache limits Dijkstra cost

## Stress

- Test: 1000 ticks remain finite cash/simTime — **PASS**

## Environment note

No device profiler attached. Numbers are structural instrumentation, not device FPS claims.
