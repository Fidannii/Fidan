# Google Play Console Checklist

Package: `com.fidani.metrobuilder` · versionName 3.0.0 · versionCode **12**

| Item | Value / Status |
|------|----------------|
| App | MetroBuilder |
| Default Language | de-DE |
| Category | Simulation / Strategy |
| Ads | No |
| Content Rating | IARC questionnaire — intent ~PEGI 7 · not kids |
| Target Audience | Teens & adults — confirm bands externally |
| Data Safety | `docs/GOOGLE_PLAY_DATA_SAFETY_PREP.md` |
| Privacy Policy | https://fidannii.github.io/Fidan/privacy.html |
| App Access | No login — all features reachable |
| Financial Features | IAP only (consumables) — declare appropriately |
| Health / Government / News | N/A |
| IAP products | 4 consumables — same IDs as Apple |
| Store Listing | `store/final/GOOGLE_METADATA_*.md` |
| AAB | **BLOCKED_EXTERNAL_SIGNING** |
| Testing | Internal required; Closed Test if personal account policy requires |
| targetSdk | **35** (verify against current Play requirement externally) |
| minSdk | 23 |
| Orientation | Portrait |

## Personal account prep
Identity verification, device verification, payments profile — all external. No personal data in repo.
