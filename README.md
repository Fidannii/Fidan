# MetroBuilder

Städtebau-Simulation — **v1.4.0 fertig** (Capacitor iOS/Android + PWA + IAP + Meta).

## Spielen (Web)

```bash
npm install
npm run dev
```

## App Store — nur noch posten

Alles vorbereitet. Auf dem **Mac**:

```bash
npm install
npm run cap:sync
npx cap open ios
```

Dann in Xcode: Team wählen → **Archive** → App Store Connect.

Details: **[STORE_PUBLISH.md](./STORE_PUBLISH.md)**  
Checkliste: **[APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md)**  
Listing-Texte: `store/APP_STORE_LISTING_DE.md`  
Screenshots: `store/screenshots/`  
Privacy (GitHub Pages): `docs/privacy.html`

Bundle ID: `com.fidani.metrobuilder` · Version **1.4.0**  
Features: Level 1–100 · Daily · Erfolge · Tutorial · Audio · Meisterschaft · Soft-Credits + Echtgeld-IAP

IAP-Setup: **[store/IAP_SETUP.md](./store/IAP_SETUP.md)**
