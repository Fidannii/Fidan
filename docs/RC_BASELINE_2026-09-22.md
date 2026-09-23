# RC Baseline — 2026-09-22 (Hardening Pass Start)

## Snapshot

| Field | Value |
|-------|--------|
| Git branch (start) | `cursor/metrobuilder-store-rc-7864` @ `1821db3` |
| Hardening branch | `cursor/metrobuilder-rc-harden-7864` |
| Working tree | clean at branch point |
| Checkpoint | `/opt/cursor/artifacts/v3_checkpoints/RC_HARDEN_BASELINE_2026-09-22_204018` |
| Source tar SHA-256 | `bebc70f28fa63dcb79a7a920a220526c852f93a92664c53e47e3e89e984ffc94` |
| Prior RC1 ZIP | `METROBUILDER_V3_STORE_RC1_2026-09-22.zip` |
| Prior RC1 SHA | `8f54aea64eb39a95e656bcb3f01b2f6bd46e56d1f96f504fface4fc08239c59c` |

## Identity

| Field | Value |
|-------|--------|
| Version | **3.0.0** |
| Build / versionCode | **11** (hardened RC) |
| Bundle / App ID | **com.fidani.metrobuilder** |
| Save version | **8** |
| Tests | **65** after harden (`it(` count; was 63 at baseline) |

## qa/screens inventory

01_launch, 02_city_small, 03_build, 04_city_medium, 05_traffic, 06_economy, 07_event, 08_progression, 09_city_large, 10_settings

Missing vs ideal set: 02_tutorial, 12_pause, 13_iap, 14_region (to capture this pass if low-risk)

## Store texts (current)

- DE App Store / Play listings rewritten for 3.0.0 (city builder tone, no “App Store bereit”)
- Screenshot concept present
- Privacy URL: https://fidannii.github.io/Fidan/privacy.html

## Blockers inherited (reclassify this pass)

See updated `docs/STORE_RELEASE_BLOCKERS.md` after review.

## Feature freeze

Only crash/save/UI-blocker/store-policy/privacy/signing/device-readiness changes allowed.
