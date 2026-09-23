# 06 Android Release
Generated: 2026-09-23T07:38:02Z

## Gates
- ANDROID_AAB_BUILD = **PASS**
- ANDROID_PRODUCTION_SIGNING = **BLOCKED_EXTERNAL**

## Project audit

| Field | Value |
|-------|-------|
| applicationId | com.fidani.metrobuilder |
| versionName | 3.0.0 |
| versionCode | 12 |
| minSdk | 23 |
| compileSdk/targetSdk | 35 |
| Permissions | INTERNET, BILLING only |
| Orientation | portrait |
| Keystore in repo | **none** |

## Build evidence

| Item | Value |
|------|-------|
| SDK | installed under `$HOME/android-sdk` for this run |
| Command | `./gradlew clean bundleRelease assembleRelease` |
| Exit | **0** |
| Artifact | `app-release.aab` (~17MB) |
| SHA256 | see `06_aab.sha256` |
| jarsigner | **jar is unsigned** (expected without key.properties) |
| APK | `app-release-unsigned.apk` |

## Next external step
Create local keystore (never commit) → sign AAB → Play Internal testing.
