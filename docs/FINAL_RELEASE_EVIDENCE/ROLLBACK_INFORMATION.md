# Rollback Information

## Source
- Branch: `cursor/metrobuilder-rc-harden-7864`
- Commit frozen in package pointer: see `01_SOURCE/_SOURCE_POINTER.txt`
- Prior immutable zips (do not overwrite):
  - `METROBUILDER_V3_STORE_RC_FINAL_2026-09-22.zip`
  - `METROBUILDER_PRE_SUBMISSION_FREEZE_2026-09-22.zip`
  - `MetroBuilder-3.0.0-AppStore-iOS-Android.zip`

## If a store build fails
1. Do not patch the same uploaded build number.
2. Increment `versionCode` / `CURRENT_PROJECT_VERSION`.
3. Re-run affected gates (tests, web build, sync, AAB).
4. Keep Save version 8 unless a migration is explicitly required and tested.
