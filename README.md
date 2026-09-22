# MetroBuilder

Städtebau-Simulation — **v1.0.0 store-ready** (Capacitor iOS/Android + PWA).

## Spielen (Web)

```bash
npm install
npm run dev
```

## App Store / Play Store

Siehe **[STORE_PUBLISH.md](./STORE_PUBLISH.md)** — Schritt-für-Schritt bis zum Upload.

Kurz:

```bash
npm install
npm run icons
npm run cap:sync
npx cap open ios      # Mac + Xcode → Archive → App Store Connect
npx cap open android  # Android Studio → AAB
```

Bundle ID: `com.fidani.metrobuilder`

## Inhalt

Kernschleife, volle GDD-Systeme, Isometrie, Avatare, Level-Aufstieg, Privacy-Seite, lokale Speicherung.
