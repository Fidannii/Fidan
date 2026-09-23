# 07 iOS Release
Generated: 2026-09-23T07:38:02Z

## Gates
- IOS_PROJECT_RELEASE_READY = **PASS**
- IOS_ARCHIVE_SIGNED = **BLOCKED_EXTERNAL**

## Project audit

| Field | Value |
|-------|-------|
| Bundle ID | com.fidani.metrobuilder |
| MARKETING_VERSION | 3.0.0 |
| CURRENT_PROJECT_VERSION | 12 |
| Deployment | iOS 14.0 |
| Orientation | Portrait-only + UIRequiresFullScreen |
| PrivacyInfo.xcprivacy | present |
| Entitlements file | none extra (no Push/iCloud/GameCenter) |
| Encryption export | ITSAppUsesNonExemptEncryption=false |

## Environment
- Host: Linux — **no Xcode / no CocoaPods**
- Archive/Validate: **NOT_RUN**

## Next external step
Mac: `pod install` → open workspace → Team signing → Archive → Validate → TestFlight.
