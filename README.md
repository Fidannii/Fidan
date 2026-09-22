# MetroBuilder

**Download-Link:** https://github.com/Fidannii/Fidan/archive/refs/heads/cursor/metrobuilder-game-app-7864.zip  
**Download-Seite:** https://fidannii.github.io/Fidan/download.html (nach Pages-Setup)

Städtebau-Simulation für **Android + iOS** — **v2.0.0** (Simulation Core · City Life · Traffic · Multi-City).

Roadmap 2.0: **[docs/ROADMAP_2.0.md](./docs/ROADMAP_2.0.md)**

## Stores hochladen (Start hier)

**→ [HOCHLADEN.md](./HOCHLADEN.md)** — komplette Anleitung Google Play + Apple App Store.

| | |
|--|--|
| Bundle / Package ID | `com.fidani.metrobuilder` |
| Version | **2.0.0** (Build / versionCode **9**) |
| Android | Ordner `android/` |
| iOS | Ordner `ios/` |

```bash
git clone https://github.com/Fidannii/Fidan.git
cd Fidan
npm install
npm run cap:sync
npx cap open android   # Google Play → Android Studio → Signed .aab
npx cap open ios       # Apple App Store → nur auf dem Mac mit Xcode
```

## Spielen (Web / Test)

```bash
npm install
npm test          # Save / IAP / Progression
npm run build
npm run ci:gate   # test + build
```

## Weitere Docs

- Checkliste: [APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md)
- Publish-Details: [STORE_PUBLISH.md](./STORE_PUBLISH.md)
- Apple Listing: `store/APP_STORE_LISTING_DE.md`
- Google Listing: `store/PLAY_STORE_LISTING_DE.md`
- IAP (beide Stores): [store/IAP_SETUP.md](./store/IAP_SETUP.md)
- Screenshots: `store/screenshots/`
- Privacy: `docs/privacy.html` → https://fidannii.github.io/Fidan/privacy.html

Features: Level 1–100 · Daily · Erfolge · Tutorial · Audio · Meisterschaft · Soft-Credits + Echtgeld-IAP · Tag/Nacht · Verkehr · Spezialisierung · Multi-City · Choice-Events
