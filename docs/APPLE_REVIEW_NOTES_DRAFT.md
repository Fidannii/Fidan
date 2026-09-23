# Apple Review Notes — Draft (MetroBuilder 3.0.0)

Bundle ID: `com.fidani.metrobuilder`

## What the app is

Offline city-building simulation. Players place roads and buildings, manage budget and traffic, respond to abstract city events. Progress is stored locally on device. No account required.

## Demo account

None — no login.

## In-App Purchases

Optional consumable products for XP / instant level. Core progression is reachable without purchase. Store UI is available from the in-game shop; there is no purchase prompt on cold start.

Sandbox testing: use App Store Connect sandbox tester. Products configured per listing IAP setup.

## Special notes

- Internet permission is used for store IAP only; core gameplay works offline.
- No user-generated content, chat, or ads.
- Age positioning: teens and adults; not Made for Kids.

## How to verify quickly

1. Launch → short intro/tutorial → place a road or building.
2. Open shop → observe IAP offers (purchase optional).
3. Background app → resume → confirm simulation resumes once.
4. Airplane mode → continue building and saving.
