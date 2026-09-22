# RC Performance Report — 2026-09-22

## City size definitions (logical)

| Size | Meaning |
|------|---------|
| SMALL | Fresh / early game, sparse builds |
| MEDIUM | Mid progression, connected road net |
| LARGE | Dense fills + traffic graph active |

## Measurements (this environment)

| Metric | Method | Result |
|--------|--------|--------|
| `npm run build` | Vite production | PASS (see clean-room) |
| Simulation 1000 ticks | Vitest | PASS, finite state |
| 10×400 soak | Vitest | PASS within 30s budget |
| Traffic recompute | On dirty only | Graph not rebuilt every frame by design |
| Startup / load / save wall times on device | — | **NOT_RUN** |
| Memory RSS growth | — | **NOT_RUN** |

## Structural safeguards

- Pause simulation on `visibilitychange` (hidden)
- Single `requestAnimationFrame` loop guard (`rafStarted`)
- Periodic save every 4s (not per frame)
- Traffic graph keyed; `roadsDirty` gates rebuild

## Gate verdict

**ACCEPTABLE_FOR_RC** for web/automation. Device mid-range validation remains external (P1).
