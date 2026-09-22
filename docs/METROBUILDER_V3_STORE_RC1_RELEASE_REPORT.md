# MetroBuilder V3 Store RC1 — Release Report

**Decision:** `RC_READY_WITH_EXTERNAL_STORE_STEPS`

## Identity

| # | Item | Value |
|--:|--|--|
| 1 | Prior candidate | `METROBUILDER_V3_ARCHITECTURE_SIMULATION_WORKING_CANDIDATE_2026-09-22.zip` |
| 2 | Prior SHA | `302e34a9c16a199dcc1ddb98c0f7d48c1251ee4d6ad6c2224df4427fc19540f1` |
| 3 | New candidate | `METROBUILDER_V3_STORE_RC1_2026-09-22.zip` |
| 4 | New SHA | `8f54aea64eb39a95e656bcb3f01b2f6bd46e56d1f96f504fface4fc08239c59c` |
| 5 | Version | **3.0.0** |
| 6 | Build / versionCode | **10** |
| 7 | Bundle ID | **com.fidani.metrobuilder** |
| 8 | Save version | **8** |

## Delta (this Store-RC pass)

| # | Item | Value |
|--:|--|--|
| 9–11 | Files | see git diff vs `d4459bf` |
| 12 | Tests total | **63** |
| 13 | PASS | **63** (re-run after `npm ci`) |
| 14 | FAIL | **0** |
| 15 | NOT_RUN | Android/iOS native, device matrix, StoreKit/Play sandbox, flight-mode |
| 16 | BLOCKED | Signed AAB/IPA without external accounts/keys |

## Feature status

| # | Area | Status |
|--:|--|--|
| 17 | Core gameplay | Polish: short intro, contextual tutorial, HUD hierarchy |
| 18 | Save | Torture tests + recoveries PASS |
| 19 | Traffic | Graph + cause blurb + overlay |
| 20 | Bus | Stable enough — kept enabled |
| 21 | Events | V2 kept |
| 22 | Visual | QA screens in `qa/screens/`; ghost valid/invalid; safe-area; 44px targets |
| 23 | Performance | Pause on hide; soak PASS (limited) |
| 24 | Offline | Local-first design; device flight-mode NOT_RUN |
| 25 | Android | NOT_RUN / external signing |
| 26 | iOS | NOT_RUN / external archive |
| 27 | IAP | Keep enabled; sandbox NOT_RUN — see `IAP_RELEASE_DECISION.md` |
| 28 | Privacy | Local save + optional IAP; minimize claims |
| 29 | Store metadata | DE/EN listings updated |

## Blockers remaining

| # | Class | Items |
|--:|--|--|
| 30 | P0 open | None known in web core; external signing accounts |
| 31 | P1 | Real-device smoke still required before submit |
| 32 | P2 | main.ts size, npm audit transitive tar, balance fine-tune |
| 33 | P3 | See `POST_LAUNCH_BACKLOG.md` |

## Scores (evidence-based, not 100%)

| Area | Score | Why |
|--|--:|--|
| Core Gameplay | 78 | Loop clear; device feel NOT_RUN |
| Architecture | 72 | Commands/clock present; main still large |
| Stability | 80 | 63 automated; no device crash data |
| Save Safety | 88 | Strong unit/torture coverage |
| Visual Quality | 74 | Polish + QA shots; not pixel-perfect audit on device |
| UX | 76 | First-minute flow improved |
| Performance | 70 | Structural OK; mid-range Android NOT_RUN |
| Android | 25 | Project present; no assembleDebug here |
| iOS | 25 | Project present; no Archive here |
| IAP | 55 | Unit OK; sandbox NOT_RUN |
| Store Metadata | 82 | Copy rewritten; screenshots need final export |
| **Overall Release Readiness** | **72** | Ready for external TestFlight/Play Internal |

## Next external steps (exact)

1. Mac: `npm ci && npm run cap:sync && cd ios/App && pod install && open App.xcworkspace`
2. Xcode: Team signing → Archive → Upload → TestFlight Internal
3. Android Studio: signed AAB with local keystore → Play Internal testing
4. Run device matrix (save/load, offline, IAP sandbox)
5. Fix only P0/P1 from tester feedback
6. Submit — **no new features**
