# MetroBuilder — V3 Save Migration Report

## Versions

| | Value |
|--|--|
| PRE-V3 save | **7** |
| Current save | **8** |

## Why v8

Schema additions required for deterministic sim + bus + delayed events:

- `seed`, `rngCount`, `simTimeMs`, `gameSpeed`
- `taxRate`
- `busLines`, `busRidership`
- `roadsDirty`, `routeCache`, `trafficGraph` (recomputed; cleared on migrate)
- `pendingEffects`, `eventCooldowns`

## Migration behavior (`migrateGame`)

1. Clears recomputable caches (`sim`, `traffic`, `trafficGraph`, `routeCache`)
2. Defaults missing v7 city/event fields
3. If `fromVersion < 8`: sets `simTimeMs = Date.now()` to keep wall-clock job/tax continuity
4. Seeds RNG if missing
5. Clamps cash/xp ≥ 0; rejects NaN cash
6. Never starts a new game while backups/lastGood remain readable

## Recovery chain (unchanged, verified by tests)

current → lastGood → backup1 → backup2 → legacy

Corrupt primary with valid lastGood → recovers cash (tested).

## Tests

- `save.test.ts` roundtrip / corrupt primary / legacy
- `v3.foundation.test.ts` seed/taxRate persistence + v7-shaped migrate
