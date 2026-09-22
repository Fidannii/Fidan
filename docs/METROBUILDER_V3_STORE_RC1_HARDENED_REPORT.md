# MetroBuilder V3 Store RC1 Hardened — Report

**Decision:** `RC_READY_WITH_EXTERNAL_STORE_STEPS`

**Date:** 2026-09-22

## Identity

| Field | Value |
|-------|--------|
| VERSION | **3.0.0** |
| BUILD / versionCode | **11** |
| BUNDLE ID | **com.fidani.metrobuilder** |
| SAVE VERSION | **8** |
| SOURCE TREE HASH | `1e3216ef47cdd04f0c391f724725ea6be3f61fc725971295685ecbdc8956d12a` |
| ZIP | `METROBUILDER_V3_STORE_RC1_HARDENED_2026-09-22.zip` |
| RC_SHA256 | `4be9a4b68c107b0b5ee6ffadf50b10bf6934e6f63c7aff80ba3d53d31cb7dc1c` |
| Prior RC1 (preserved) | `8f54aea64eb39a95e656bcb3f01b2f6bd46e56d1f96f504fface4fc08239c59c` |

## Tests

| | Count |
|--|------:|
| TESTS_BEFORE (prior RC1) | 63 |
| TESTS_AFTER | **65** |
| PASS | **65** |
| FAIL | **0** |

Clean-room: `npm ci` → `npm test` → `npm run build` — **PASS**

New coverage this pass: friendly load `userMessage`; 10-seed soak.

## Builds

| Target | Status |
|--------|--------|
| WEB | **PASS** |
| ANDROID | **NOT_RUN** / **BLOCKED_EXTERNAL_SIGNING** (no SDK/keystore in agent) |
| IOS | **NOT_RUN** (no macOS/Xcode) — project prepared for Team → Archive |

`npx cap sync` — **PASS** (CocoaPods skipped — expected on Linux)

## Gameplay / Systems

| Area | Status |
|------|--------|
| GAMEPLAY | Freeze + polish retained |
| SAVE | Torture + recovery + friendly errors **PASS** |
| TRAFFIC | Graph V2 kept |
| BUS | **SHIP** |
| EVENTS | V2 kept; abstract disasters |
| ECONOMY | Acceptable for RC; fine-tune deferred |
| UI / VISUAL | Score ~7.1; device screenshots external |
| PERFORMANCE | ACCEPTABLE_FOR_RC (device NOT_RUN) |
| OFFLINE | Local-first; flight-mode device NOT_RUN |
| BACKGROUND | Visibility pause + single rAF guard |
| IAP | **IAP_SHIP** (soft UX); sandbox NOT_RUN |
| PRIVACY | Local-first; manifests aligned |
| AGE RATING | Target Apple ~9+ / PEGI~7 intent — questionnaire external |
| STORE METADATA | Listings present; no false “App Store bereit” |

## Blockers

| Class | Status |
|-------|--------|
| P0 open (code) | **0** |
| P0 external | Signing / accounts (**BLOCKED_EXTERNAL**) |
| P1 open | Store screenshot device export (P1-07) |
| P2 / P3 | Deferred post-launch |

## Release freeze

Active — see `docs/RELEASE_FREEZE.md`

## External next steps

See `docs/EXTERNAL_STORE_STEPS.md`
