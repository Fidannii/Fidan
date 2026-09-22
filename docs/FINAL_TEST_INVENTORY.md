# Final Test Inventory — MetroBuilder 3.0.0

**Date:** 2026-09-22 · Evidence: `npm test` (vitest)

| File | Count | Purpose | Categories | Status |
|------|------:|---------|------------|--------|
| `src/core/save.test.ts` | 11 | checksum, persist/load, corrupt recovery, legacy migrate, IAP idempotency, friendly messages | SAVE, MIGRATION, IAP | PASS |
| `src/core/save.torture.test.ts` | 11 | multi-step, cities, bus, corrupt chains, traffic dirty, soak, NaN reject | SAVE, TRAFFIC, MULTI-CITY, PERFORMANCE | PASS |
| `src/core/save.migration.test.ts` | 6 | v5/v6/v7/v8 matrix + recovery chain | SAVE, MIGRATION | ADDED |
| `src/core/v3.foundation.test.ts` | 20 | RNG/clock, seed persist, bus, commands, 1000-tick + 10-seed soak | WORLD, TRAFFIC, ECONOMY, PERFORMANCE | PASS |
| `src/core/events.test.ts` | 4 | event timing / choices | EVENTS | PASS |
| `src/core/traffic.test.ts` | 4 | graph / routing basics | TRAFFIC | PASS |
| `src/core/systems.test.ts` | 6 | city sim systems | ECONOMY, WORLD | PASS |
| `src/core/cities.test.ts` | 4 | multi-city switch | MULTI-CITY | PASS |
| `src/core/cityProgress.test.ts` | 5 | progression / tiers | ECONOMY | PASS |

## Totals (expected after migration tests)

| | |
|--|--:|
| Prior confirmed | 65 |
| New migration tests | +6 |
| Expected | **71** |

## NOT_RUN (device / external)

| Area | Status |
|------|--------|
| UI visual device matrix | NOT_RUN |
| Tutorial persistence on device | NOT_RUN |
| Background/resume on device | PARTIAL (unit: rAF guard in code; device NOT_RUN) |
| Offline / airplane | NOT_RUN (local-first design) |
| IAP sandbox | NOT_RUN |
| Android/iOS native instrumented | NOT_RUN |
