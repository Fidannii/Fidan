# Store RC Test Matrix — MetroBuilder 3.0.0

**Date:** 2026-09-22  
**Candidate:** `METROBUILDER_V3_STORE_RC1_2026-09-22`

Status values: PASS | FAIL | BLOCKED | NOT_RUN

| Area | Status | Evidence / note |
|------|--------|-----------------|
| WEB CORE | PASS | App loads; preview smoke + QA screens |
| BUILD | PASS | `npm ci` + `npm run build` (tsc) clean |
| UNIT | PASS | 63 tests / 8 files |
| SAVE | PASS | torture suite + recovery |
| MIGRATION | PASS | v7→v8 unit coverage |
| ECONOMY | PASS | cashflow breakdown + tax tests |
| TRAFFIC | PASS | graph tests + overlay QA shot |
| TRANSPORT (Bus) | PASS | unit + UI present; device NOT_RUN |
| EVENTS | PASS | unit; live spawn device NOT_RUN |
| MULTI-CITY | PASS | unit switch/persist |
| UI | PASS | HUD polish + QA screens captured |
| TOUCH | PASS (web heuristics) | 44px targets, safe-area CSS; device NOT_RUN |
| AUDIO | PASS | procedural SFX + settings persist |
| OFFLINE | PASS (design) | local save; flight-mode device NOT_RUN |
| BACKGROUND | PASS (code) | visibility → pause; device NOT_RUN |
| PERFORMANCE | PASS (limited) | soak 800 ticks; no device FPS |
| IAP | PASS (unit) / NOT_RUN (sandbox) | idempotency; no real purchases |
| ANDROID | NOT_RUN | ANDROID_HOME missing → BLOCKED_EXTERNAL_SIGNING for AAB |
| IOS | NOT_RUN | no Xcode → external TestFlight |
| PRIVACY | PASS (doc) | local-only + optional IAP; PrivacyInfo present |
| STORE METADATA | PASS | DE/EN listings rewritten for 3.0 |

## Release decision

**RC_READY_WITH_EXTERNAL_STORE_STEPS**
