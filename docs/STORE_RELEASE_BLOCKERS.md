# MetroBuilder — Store Release Blockers

**Updated:** 2026-09-22 · Branch `cursor/metrobuilder-store-rc-7864`  
**Feature freeze:** active for first store release (no new major systems).

## P0 — Release impossible if true

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| P0-01 | App fails to start / web build broken | **CLEAR** | Clean `npm ci` + test + build PASS (RC1) |
| P0-02 | Reproducible save loss | **CLEAR (automated)** | Torture suite PASS; device soak still recommended |
| P0-03 | Migration destroys saves | **CLEAR (unit)** | v7→v8 covered |
| P0-04 | Bundle ID wrong | **CLEAR** | `com.fidani.metrobuilder` |
| P0-05 | Signing impossible in-repo | **EXTERNAL** | `BLOCKED_EXTERNAL_SIGNING` / Apple account |
| P0-06 | Privacy text contradicts behavior | **CLEAR** | Local-first + optional IAP |
| P0-07 | Core loop unplayable | **CLEAR** | Intro/tutorial/HUD polished |
| P0-08 | Known core-loop crash | **CLEAR (automated)** | Device NOT_RUN |
| P0-09 | IAP broken | **MITIGATED** | Soft UX; sandbox external |

## P1 — Severe quality

| ID | Issue | Status | Plan |
|----|-------|--------|------|
| P1-01 | First 60s / tutorial walls | OPEN | Context tips, shorten intro |
| P1-02 | Touch / safe-area / HUD clutter | OPEN | CSS safe-area + HUD hierarchy |
| P1-03 | Build feedback vague | OPEN | Ghost/validation messages already partial — tighten |
| P1-04 | Accidental demolish | OPEN | Confirm for production buildings |
| P1-05 | Background timers keep running | OPEN | `visibilitychange` → pause |
| P1-06 | Traffic cause unclear | OPEN | Overlay + short congestion blurb |
| P1-07 | Store screenshots / copy not sales-ready | OPEN | Metadata + screenshot concept |
| P1-08 | Bus UI discoverability weak | OPEN | Keep if stable; clarify empty state |

## P2 — Should improve before release

| ID | Issue | Status |
|----|-------|--------|
| P2-01 | Audio volume / missing music | Optional — SFX exists; no unlicensed music |
| P2-02 | main.ts still large | Accept for RC; backlog |
| P2-03 | npm audit transitive tar | Dev tooling; document |
| P2-04 | Balance tuning | Light pass only |
| P2-05 | Icon / splash polish | Audit; replace only if better |

## P3 — Post-launch (do not build now)

See `docs/POST_LAUNCH_BACKLOG.md` (created this pass): Metro/Tram, more buildings, cloud backend, languages, clans, etc.

## Work order

**P0 → P1 → P2.** P3 frozen until after store submission.
