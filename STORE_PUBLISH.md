# MetroBuilder — App-Store Veröffentlichung

Diese Anleitung bringt dich von diesem Repo zum **App Store Upload**.
Alles Nötige ist vorbereitet — auf dem Mac nur noch signieren & hochladen.

## Was schon fertig ist

| Asset | Status |
|-------|--------|
| Capacitor iOS/Android (`com.fidani.metrobuilder` 1.4.0) | ✅ |
| App-Icon 1024 (ohne Alpha) + Splash | ✅ |
| Privacy Manifest (`PrivacyInfo.xcprivacy`) | ✅ |
| Export Compliance (`ITSAppUsesNonExemptEncryption=NO`) | ✅ |
| **Echtgeld-IAP** (Consumables, StoreKit) | ✅ `store/IAP_SETUP.md` |
| Listing-Texte DE/EN | ✅ `store/APP_STORE_LISTING_*.md` |
| Screenshots (iPhone 6.7" / 6.5") | ✅ `store/screenshots/` |
| Privacy Policy (GitHub Pages) | ✅ `docs/privacy.html` |
| Review-Notizen & Checkliste | ✅ |

## Voraussetzungen (nur du)

1. [Apple Developer Program](https://developer.apple.com/programs/) (99 USD/Jahr)
2. Mac mit **Xcode 16+**
3. App Store Connect Zugang

## Einmalig: Privacy-URL live schalten

1. Repo auf GitHub (bereits: `Fidannii/Fidan`)
2. **Settings → Pages → Deploy from a branch**
3. Branch: `main` (oder nach Merge dieses PRs), Folder: `/docs`
4. URL: `https://fidannii.github.io/Fidan/privacy.html`

## Mac — Upload (3 Befehle)

```bash
git clone https://github.com/Fidannii/Fidan.git
cd Fidan
git checkout cursor/metrobuilder-game-app-7864   # oder main nach Merge
npm install
npm run cap:sync
npx cap open ios
```

In Xcode:

1. **Signing & Capabilities** → dein Team
2. Bundle ID = `com.fidani.metrobuilder`
3. Destination = **Any iOS Device (arm64)**
4. **Product → Archive → Distribute App → App Store Connect → Upload**

Optional mit `ios/exportOptions.plist` nach dem Archive.

## App Store Connect

1. Neue App anlegen (Bundle ID exakt `com.fidani.metrobuilder`)
2. Texte aus `store/APP_STORE_LISTING_DE.md` einfügen
3. Screenshots aus `store/screenshots/` hochladen (mind. 01–05 iPhone 6.7")
4. Privacy URL setzen
5. Build auswählen → **Zur Prüfung einreichen**

Altersfreigabe **9+**, Kategorie **Spiele → Simulation**, **IAP aktiv** (Consumables), kein Tracking.

## In-App-Käufe (Echtgeld) — Apple + Google

Vollständige Anleitung: **[store/IAP_SETUP.md](./store/IAP_SETUP.md)**

| Store | Technik | Wo anlegen |
|-------|---------|------------|
| **Apple App Store** | StoreKit (Apple-ID) | App Store Connect |
| **Google Play** | Play Billing 7 | Play Console |

Product IDs (beide Stores gleich):
- `com.fidani.metrobuilder.xp_small` / `_medium` / `_large`
- `com.fidani.metrobuilder.level_up`

Xcode: Capability **In-App Purchase**  
Optional lokal: Schema → StoreKit Configuration → `ios/App/StoreKitConfig.storekit`


## Screenshots neu erzeugen (optional)

```bash
npm run build && npm run preview -- --host 127.0.0.1 --port 4173
# anderes Terminal:
npm run screenshots
```

## Android (optional parallel)

```bash
npx cap open android
# Build → Generate Signed Bundle → .aab
```

## Danach

Nur noch in App Store Connect auf **Zur Prüfung einreichen**.
