# Privacy Notes — Store Submission

## App behavior (code-aligned)
- Game progress stored **locally** on device
- No analytics SDK
- No advertising ID
- No account / login
- No location / contacts / camera / mic
- IAP receipts stored locally for idempotent grants; payment handled by Apple/Google
- Tracking: false (PrivacyInfo.xcprivacy)

## Public policy
https://fidannii.github.io/Fidan/privacy.html  
Source mirrors: `docs/privacy.html`, `public/privacy.html`

## Store declarations
- Apple Privacy Nutrition Labels: declare consistent with above (typically no collected data types for app-controlled analytics)
- Google Data Safety: see `docs/GOOGLE_PLAY_DATA_SAFETY_PREP.md`

## Consistency rule
If behavior changes, update policy + manifests + store forms in the same release.
