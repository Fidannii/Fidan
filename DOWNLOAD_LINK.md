# Download-Link — MetroBuilder 2.0.0 (App Store bereit)

## Direkt-Download (ZIP vom Branch)

https://github.com/Fidannii/Fidan/archive/refs/heads/cursor/metrobuilder-game-app-7864.zip

## Download-Seite (GitHub Pages)

https://fidannii.github.io/Fidan/download.html  

(Pages: Repo → Settings → Pages → Branch `cursor/metrobuilder-game-app-7864` oder `main` nach Merge, Folder `/docs`)

## Cloud-Agent-Paket (lokal im Agent)

`/opt/cursor/artifacts/downloads/MetroBuilder-2.0.0-appstore.zip`

## Was du bekommst

- iOS-Projekt (`ios/`, Bundle ID `com.fidani.metrobuilder`, v2.0.0 / Build 9)
- Android-Projekt (`android/`)
- Store-Listings + Screenshots + IAP-Setup
- Startanleitung: **[APPSTORE_START.md](./APPSTORE_START.md)**

## Sofort App Store (Mac)

```bash
# nach ZIP-Download
npm install
npm run cap:sync
cd ios/App && pod install && open App.xcworkspace
# Xcode: Team → Archive → Distribute → App Store Connect
```

Ausführlich: [APPSTORE_START.md](./APPSTORE_START.md) · beide Stores: [HOCHLADEN.md](./HOCHLADEN.md)
