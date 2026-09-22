# Google Play Data Safety Prep

Based on **current code behavior** (not guessed future features).

| Question | Answer |
|----------|--------|
| Does the app collect personal data? | **No** beyond on-device save (not uploaded by app) |
| Data shared with third parties by app? | **No** |
| Data encrypted in transit by app backend? | **N/A** — no app backend |
| Users can request deletion? | Uninstall / in-app Reset clears local save |
| Data required for app? | Local save required for continuity; no account |
| Approximate location | **No** |
| Precise location | **No** |
| Personal info | **No** |
| Financial info in app | **No** (Play Billing processes payments) |
| Photos/videos | **No** |
| Contacts | **No** |
| App activity analytics | **No** |
| Device IDs / advertising ID | **No** |
| Purchases | Declared via Play Billing; app stores local receipt id only |

Mark any Console field unclear as **Unknown** until legal review — do not invent.
