# TestFlight / iOS Archive — Result

## Status: **BLOCKED_EXTERNAL**

Reason: Agent host is Linux — no Xcode, no CocoaPods, no Apple signing team.

## Project verified

| Field | Value |
|-------|-------|
| Bundle ID | com.fidani.metrobuilder |
| MARKETING_VERSION | 3.0.0 |
| CURRENT_PROJECT_VERSION | **13** |
| Deployment | 14.0 |
| Portrait-only | yes |
| PrivacyInfo.xcprivacy | present |

## Exact human action (Mac)

```bash
git checkout cursor/metrobuilder-rc-harden-7864
npm ci && npm run cap:sync
cd ios/App && pod install && open App.xcworkspace
```

In Xcode: Team → In-App Purchase capability optional (IAP UI gated off) → Any iOS Device → **Product → Archive** → Validate → Upload → TestFlight Internal.

Reply: **“TestFlight Build hochgeladen”** with build number when done.
