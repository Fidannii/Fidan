# MetroBuilder — V3 Baseline Report

**Generated:** 2026-09-22T20:04:00Z  
**Git HEAD:** `48deef4474b0200a3833475c5e090fa2e8e71792`  
**Branch:** `cursor/metrobuilder-game-app-7864`  
**PRE-V3 Checkpoint:** `/opt/cursor/artifacts/v3_checkpoints/PRE_V3_2026-09-22_200355`  
**Git checkpoint ref:** `pre-v3-checkpoint-2026-09-22`  
**Source tar SHA-256:** see checkpoint `SOURCE_TAR_SHA256.txt`  
**Manifest:** [`V3_SOURCE_MANIFEST_SHA256.txt`](./V3_SOURCE_MANIFEST_SHA256.txt)

## Identity

| Field | Value |
|-------|--------|
| package.json version | **2.0.0** |
| Android versionName | **2.0.0** |
| Android versionCode | **9** |
| iOS MARKETING_VERSION | **2.0.0** |
| iOS CURRENT_PROJECT_VERSION | **9** |
| Capacitor appId | **com.fidani.metrobuilder** |
| iOS PRODUCT_BUNDLE_IDENTIFIER | **com.fidani.metrobuilder** |
| Save envelope version | **7** |
| Node | **v22.14.0** |
| npm | **10.9.7** |
| Java (host) | OpenJDK 21.0.10 |

## Git status at baseline

- Working tree: **clean** (no uncommitted changes)
- Uncommitted changes: none → nothing discarded
- Existing backups: checkpoint created under new unique directory; no overwrite

## Source line counts (PRE-V3)

| Path | Lines |
|------|------:|
| `src/main.ts` | 1172 |
| `src/core/sim.ts` | 635 |
| `src/core/systems.ts` | 387 |
| `src/core/save.ts` | 248 |
| `src/core/traffic.ts` | 72 |
| `src/core/events.ts` | 120 |
| `src/render/fx.ts` | 54 |
| `src/render/sprites.ts` | 663 |
| `src/render/view.ts` | 669 |
| `src/ui/avatars.ts` | 49 |
| **Sum of listed** | **4069** |

## Project structure (`src/`)

```
src/
  audio/sfx.ts
  core/
    catalog.ts, cities.ts, cityProgress.ts, events.ts, meta.ts,
    progression.ts, save.ts, sim.ts, systems.ts, traffic.ts, types.ts, world.ts
    + *.test.ts (6 files)
  iap/catalog.ts, iap/iap.ts
  main.ts
  render/fx.ts, sprites.ts, view.ts
  style.css
  ui/avatars.ts
  vite-env.d.ts
```

## Tests (PRE-V3)

| File | `it(` count |
|------|------------:|
| `src/core/save.test.ts` | 10 |
| `src/core/systems.test.ts` | 6 |
| `src/core/cityProgress.test.ts` | 5 |
| `src/core/cities.test.ts` | 4 |
| `src/core/traffic.test.ts` | 4 |
| `src/core/events.test.ts` | 4 |
| **Total** | **33** |

Scripts present: `dev`, `build`, `preview`, `cap:sync`, `cap:ios`, `cap:android`, `release:prep`, `icons`, `screenshots`, `pack:appstore`, `test`, `test:watch`, `ci:gate`  
**Not present:** `typecheck`, `lint` → will be reported NOT_RUN if requested.

## Known stubs

| Area | Status |
|------|--------|
| Cloud sync | Stub only (`cloudSyncAt` local marker). UI: „Cloud-Save (optional Stub)“ |
| Online backend | None |
| Native Store Sandbox | Not executed in this environment |
| Traffic | Aggregated global model (`computeTraffic`), not road-graph routing |
| Bus | Stations (`station`/`depot`) reduce demand heuristically; no BusLine system |
| Events | Choice invest/ignore + immediate effects; no delayed/follow-up graph |
| IAP | Cordova Purchase plugin + idempotent receipts; web = unavailable/demo |

## Known TODOs / FIXMEs in source

- No `TODO`/`FIXME` markers in `src/` (grep).
- Docs mark native sandbox as open; Phase 7 cloud as stub.

## Save system (v7)

- Keys: current / tmp / backup1 / backup2 / lastKnownGood
- Checksum on envelope
- Migration via `migrateGame` (clears sim cache; defaults specialization/cities/events)
- Multi-city: `Game.cities` partial map

## IAP status

- Module: `src/iap/iap.ts` + `src/iap/catalog.ts`
- Platforms: Apple / Google / Web-Demo
- Idempotency: `g.iapReceipts`
- Real purchases: **not** triggered in this cloud agent run

## Traffic status

- Global snapshot: segments, volume, capacity, congestion, busStops
- Overlay colors via `congestionAt`
- No RoadNode/RoadEdge graph yet

## Store status (honest)

| Item | Status |
|------|--------|
| Capacitor projects | Present (`ios/`, `android/`) |
| Bundle ID frozen | `com.fidani.metrobuilder` |
| Signed AAB | NOT produced here |
| Play Internal Testing | NOT_RUN |
| Xcode Archive / TestFlight | NOT_RUN (no macOS/Xcode) |
| StoreKit / Play Billing sandbox | NOT_RUN |
| Claim “App Store ready” | **Must not** be asserted; correct: “Store submission prepared” |

## Toolchain availability (this host)

| Tool | Status |
|------|--------|
| Node/npm | Available |
| Java | Available |
| ANDROID_HOME / SDK | **MISSING** |
| xcodebuild | **MISSING** |
| CocoaPods | **MISSING** |

## Open points entering V3

1. `main.ts` monolith (~1172 lines): bootstrap + HUD + panels + commands mixed
2. Non-deterministic sim: `Math.random()` / `Date.now()` in gameplay paths
3. Traffic is aggregate, not graph-based
4. No BusLine vertical slice
5. Events lack delayed/follow-up effects
6. Cloud stub wording must stay accurate
7. Store-copy must not overclaim readiness
8. Android/iOS native builds blocked on this host without SDK/Xcode

## Hard constraints (carried into V3)

- No Bundle-ID change
- No real store purchases
- No secrets / signing keys
- No feature explosion / rewrite
- No fake PASS reports
