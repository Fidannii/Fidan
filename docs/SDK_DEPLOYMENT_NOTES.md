# Target SDK / Deployment Notes

## Android
| Field | Value | Notes |
|-------|-------|-------|
| minSdk | 23 | |
| compileSdk | 35 | |
| targetSdk | 35 | Aligns with recent Play requirements; **EXTERNAL_VERIFY** against Console warning on upload day |

## iOS
| Field | Value |
|-------|-------|
| IPHONEOS_DEPLOYMENT_TARGET | 14.0 |
| Rationale | Capacitor 7 compatible; not artificially high |

## Encryption
`ITSAppUsesNonExemptEncryption` = false (standard HTTPS only / no custom crypto claimed)
