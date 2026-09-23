# Save Migration Matrix

**Target:** SAVE_VERSION **8**  
**Evidence:** `src/core/save.migration.test.ts` + existing save tests

| SOURCE_VERSION | TARGET_VERSION | TEST | RESULT | DATA_LOSS | NOTES |
|---------------:|---------------:|------|--------|-----------|-------|
| 5 | 8 | `v5 → v8` | PASS | **NO** | seed/tax/bus defaults; cash/level kept |
| 6 | 8 | `v6 → v8` | PASS | **NO** | specialization/tier defaults |
| 7 | 8 | `v7 → v8` | PASS | **NO** | cities kept; sim caches cleared (recomputed) |
| 8 | 8 | identity | PASS | **NO** | seed/tax/simTime preserved |
| corrupt primary | 8 | lastGood / backups | PASS | **NO** | never silent new-game while recovery exists |
| backup2 only | 8 | chain | PASS | **NO** | recovers older snapshot |

## Policy

- Supported saves: **DATA_LOSS = NO** for cash/level/inventory/cities
- Recomputable caches (`sim`, `traffic`, `trafficGraph`, `routeCache`) intentionally cleared — not player progress loss
- All-corrupt → new game with friendly `userMessage` (not a raw exception)
