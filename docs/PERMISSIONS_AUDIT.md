# Permissions Final Audit — MetroBuilder 3.0.0

## Android (`AndroidManifest.xml`)

| Permission | Required? | Justification |
|------------|-----------|---------------|
| `android.permission.INTERNET` | Yes (IAP) | Play Billing / store plugin; core play works offline |
| `com.android.vending.BILLING` | Yes (IAP) | In-app purchases |

**Absent (correct):** LOCATION, CAMERA, MICROPHONE, CONTACTS, STORAGE broad access, AD_ID (not used).

## iOS (`Info.plist` / capabilities)

| Item | Status |
|------|--------|
| Camera / Mic / Location usage strings | Not present — correct |
| Tracking | PrivacyInfo `NSPrivacyTracking` = false |
| Reason APIs | UserDefaults CA92.1; FileTimestamp C617.1; DiskSpace E174.1; SystemBootTime (Capacitor) |

## Verdict

No unnecessary permissions declared. Do not add location/camera/contacts without a real feature need.
