# MetroBuilder — V3 Build Baseline

**Run date:** 2026-09-22T20:04Z–20:05Z  
**Host:** Cloud agent Linux (no Android SDK, no Xcode)  
**Git branch:** `cursor/metrobuilder-v3-foundation-7864` (from PRE-V3 `48deef4`)

## Commands executed

| Step | Command | Result |
|------|---------|--------|
| Node | `node --version` → v22.14.0 | PASS |
| npm | `npm --version` → 10.9.7 | PASS |
| Clean install | `rm -rf node_modules dist && npm ci` | **PASS** (exit 0) |
| Unit tests | `npm test` | **PASS** — 6 files, **33** tests |
| Production build | `npm run build` (`tsc && vite build`) | **PASS** |
| typecheck script | `npm run typecheck` | **NOT_RUN** — script does not exist (tsc covered by `build`) |
| lint script | `npm run lint` | **NOT_RUN** — script does not exist |
| Capacitor | `npx cap sync` | **PASS** (pods/xcodebuild skipped with warnings) |
| Android `./gradlew test` | — | **NOT_RUN** — `ANDROID_HOME` missing |
| Android `assembleDebug` | — | **NOT_RUN** — `ANDROID_HOME` missing |
| iOS Archive | — | **IOS_BUILD_NOT_RUN_ENVIRONMENT_UNAVAILABLE** |

## Hard gate

Web source builds cleanly. Proceeding to architecture/simulation work is allowed.

## npm audit (informational)

- 8 vulnerabilities reported (3 moderate, 4 high, 1 critical)
- Critical path: transitive `tar` via `@capacitor/assets` → `@capacitor/cli` (dev/assets tooling)
- No blind major upgrades applied in this baseline step
- Documented for `V3_RELEASE_READINESS.md`

## Notes

- `npm ci` respected `package-lock.json`; no lockfile edits required for install success.
- Capacitor sync copied web assets into `android/` and `ios/`; CocoaPods/xcodebuild unavailable on host.
