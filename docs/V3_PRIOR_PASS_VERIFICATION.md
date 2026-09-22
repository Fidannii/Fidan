# MetroBuilder — V3 Prior Pass Verification (2026-09-22)

Independent check before Store-RC work. Claims re-verified where possible.

## Candidate under review

| Field | Value | Evidence |
|-------|--------|----------|
| Filename | `METROBUILDER_V3_ARCHITECTURE_SIMULATION_WORKING_CANDIDATE_2026-09-22.zip` | `/opt/cursor/artifacts/downloads/` |
| SHA-256 | `302e34a9c16a199dcc1ddb98c0f7d48c1251ee4d6ad6c2224df4427fc19540f1` | **PASS** — `sha256sum` matches docs + artifact |
| Version | **3.0.0** | package.json / Android / iOS |
| Build / versionCode | **10** | android `build.gradle`, iOS `CURRENT_PROJECT_VERSION` |
| Bundle / App ID | **com.fidani.metrobuilder** | capacitor.config.ts + native projects |
| Save version | **8** | `SAVE_VERSION` in `src/core/save.ts` |
| Git | `d4459bf` on `cursor/metrobuilder-v3-foundation-7864` | `git log` |
| Source manifest | `docs/V3_SOURCE_MANIFEST_SHA256.txt` | present |

## Re-executed this session

| Check | Result | Evidence |
|-------|--------|----------|
| `npm test` | **PASS** — 7 files, **52** tests | `/tmp/rc_verify_test.log` |
| `npm run build` | **PASS** | `/tmp/rc_verify_build.log` |
| Candidate SHA recompute | **PASS** (matches published hash) | command output |
| `npm ci` clean reinstall | **NOT_RUN** this verification step (tree already installed; will run in final RC clean build) | — |

## Claimed vs verified

| Topic | Prior claim | Verification |
|-------|-------------|--------------|
| main.ts PRE→now | 1172 → ~1225 | **PASS** — current `wc -l` = 1225 |
| Traffic V2 | graph + routing | **PASS** — code + tests in suite |
| Bus slice | depot/stops/ridership | **PASS** — tests + `src/core/bus.ts` |
| Events V2 | delayed/seeded | **PASS** — tests + code |
| IAP | idempotent unit; no real purchase | **PASS** unit; sandbox **NOT_RUN** |
| Android build | NOT_RUN | **CONFIRMED** — `ANDROID_HOME=MISSING` |
| iOS build | NOT_RUN | **CONFIRMED** — no xcodebuild |
| “App Store ready” | forbidden wording | **PASS** — docs use submission-prepared language |

## Open blockers entering Store-RC

1. No Android SDK / no signed AAB on this host → external
2. No macOS/Xcode → TestFlight external
3. No device smoke matrix → NOT_RUN
4. Visual/UX polish for first 5 minutes still needed (this pass)
5. `main.ts` still large monolith (architecture OK enough for release; not P0)

## Decision for this pass

Proceed with **feature freeze** + polish → aim for  
`RC_READY_WITH_EXTERNAL_STORE_STEPS` (native signing/accounts external).
