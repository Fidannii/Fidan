# Store Release Blockers — Hardening Review

**Updated:** 2026-09-22 (RC harden pass)  
**Statuses:** OPEN | FIXED | VERIFIED | DEFERRED_POST_LAUNCH | BLOCKED_EXTERNAL

## P0

| ID | Issue | Status |
|----|-------|--------|
| P0-01 | Web start / build broken | **VERIFIED** — clean `npm ci`+test+build |
| P0-02 | Reproducible save loss | **VERIFIED** (automated) — torture + recovery; device soak external |
| P0-03 | Migration destroys saves | **VERIFIED** (unit) |
| P0-04 | Bundle ID wrong | **VERIFIED** — `com.fidani.metrobuilder` |
| P0-05 | Signing in cloud agent | **BLOCKED_EXTERNAL** |
| P0-06 | Privacy mismatch | **VERIFIED** → privacy claims 3.0.x / local-first; data map aligned |
| P0-07 | Core unplayable | **VERIFIED** — polish present |
| P0-08 | Core-loop crash (known) | **VERIFIED** (automated) — device NOT_RUN |
| P0-09 | IAP broken checkout | **BLOCKED_EXTERNAL** (sandbox) — decision: ship with soft UX; disable if sandbox fails |

## P1

| ID | Issue | Status |
|----|-------|--------|
| P1-01 | First 60s walls | **VERIFIED** — short intro/tutorial |
| P1-02 | Touch/safe-area/HUD | **VERIFIED** — HUD hierarchy + 44px + safe-area |
| P1-03 | Build feedback | **VERIFIED** — ghost valid/invalid + cost float |
| P1-04 | Accidental demolish | **VERIFIED** — confirm modal |
| P1-05 | Background timers | **VERIFIED** — visibility pause + single rAF guard |
| P1-06 | Traffic cause unclear | **VERIFIED** — blurb + overlay |
| P1-07 | Store screenshots final export | **OPEN** — concept + QA set; final device captures external |
| P1-08 | Bus discoverability | **VERIFIED** — kept SHIP with clearer copy |
| P1-09 | Friendly load errors | **VERIFIED** — `userMessage` + regression tests |
| P1-10 | Landscape without layout | **FIXED** — portrait-only lock (iOS+Android) |
| P1-11 | Play listing claimed PEGI 3 | **FIXED** — replaced with questionnaire intent |

## P2

| ID | Status |
|----|--------|
| P2-01 Audio/music | **DEFERRED_POST_LAUNCH** |
| P2-02 main.ts size | **DEFERRED_POST_LAUNCH** |
| P2-03 npm audit tar (dev) | **DEFERRED_POST_LAUNCH** (dev-only path) |
| P2-04 Balance fine-tune | **DEFERRED_POST_LAUNCH** |
| P2-05 Icon redesign | **DEFERRED_POST_LAUNCH** unless store rejects |

## P3

All in `docs/POST_LAUNCH_BACKLOG.md` — **DEFERRED_POST_LAUNCH**
