# MetroBuilder — V3 Release Readiness

## Honest status

| Claim | Verdict |
|-------|---------|
| Web reproducible (`npm ci` / test / build) | **PASS** |
| Capacitor sync | **PASS** (pods skipped) |
| Android debug APK | **NOT_RUN** (no SDK) |
| Signed AAB / Play Internal | **NOT_RUN** |
| Xcode Archive / TestFlight | **NOT_RUN** |
| StoreKit / Play Billing sandbox | **NOT_RUN** |
| “App Store bereit” | **FORBIDDEN** — use “Store-Submission vorbereitet” |

## Bundle identity (unchanged)

`com.fidani.metrobuilder` · version **3.0.0** · build/versionCode **10**

## IAP

- Idempotent receipts retained
- No real purchases executed in this environment
- Web = demo prices only

## Cloud

- Stub + `CloudSaveProvider` interface only
- UI wording: “Cloud-Save vorbereitet (Stub)”

## npm audit

8 vulnerabilities (dev transitive `tar` via `@capacitor/assets`, uuid via xcode tooling).  
No blind major upgrades applied. Track for a dedicated dependency pass.

## Secrets

No signing keys / `.env` secrets added. `android/key.properties` remains gitignored.
