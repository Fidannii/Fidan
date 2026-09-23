# Rotation Policy — MetroBuilder 3.0.0

**Policy:** **Portrait-only** for first store release.

## Rationale
HUD, build bar, modals and tutorial are designed for portrait phones. Landscape was previously declared on iOS without a finished landscape layout — removed for submission readiness.

## Implementation
- iOS `Info.plist`: Portrait only + `UIRequiresFullScreen` = true
- Android `MainActivity`: `android:screenOrientation="portrait"`

## Post-launch
Landscape support only after dedicated layout pass (backlog).
