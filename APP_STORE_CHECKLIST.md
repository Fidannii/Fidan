# App Store / Play Store — Checkliste (3.0.0 Build 12)

Vollständige Anleitung: **[HOCHLADEN.md](./HOCHLADEN.md)** · Kurzstart: **[APPSTORE_START.md](./APPSTORE_START.md)**  
**Download:** https://github.com/Fidannii/Fidan/archive/refs/heads/cursor/metrobuilder-rc-harden-7864.zip

## Vor dem Upload
- [ ] **Google Play Developer** Account aktiv
- [ ] **Apple Developer** Account aktiv (+ Mac mit Xcode)
- [ ] App in Play Console / App Store Connect angelegt (`com.fidani.metrobuilder`)
- [ ] **IAP Apple:** 4 Consumables (`store/IAP_SETUP.md`)
- [ ] **IAP Google:** dieselben Product IDs + Internal testing AAB
- [ ] Xcode Capability: **In-App Purchase**
- [ ] Sandbox-Kauf (Apple) und/oder License-Tester (Google) OK
- [ ] GitHub Pages: `/docs` → Privacy live
- [ ] Screenshots (Device-Größen) — Konzept: `store/final/` + `store/SCREENSHOT_CONCEPT.md`
- [ ] Listing: `store/final/APPLE_METADATA_*.md` + `store/final/GOOGLE_METADATA_*.md`
- [ ] `npm ci && npm run cap:sync` ausgeführt
- [ ] Android: Keystore + Signed Bundle (.aab)
- [ ] iOS: Xcode Signing → Archive → Upload

## Archive (iOS / Apple App Store)
1. `npx cap open ios`
2. Optional: Scheme → StoreKit Configuration → `StoreKitConfig.storekit`
3. Destination: Any iOS Device
4. Product → Archive → App Store Connect → Upload

## Bundle (Android / Google Play)
1. Keystore erzeugen (siehe `HOCHLADEN.md`)
2. `npx cap open android`
3. Build → Generate Signed Bundle → `.aab`
4. Play Console → Internal testing zuerst, dann Production

## Review-Formular
- **Login nötig?** Nein
- **IAP aktiv?** Ja — Apple App Store + Google Play (Consumables) — Sandbox vor Production prüfen
- **Tracking?** Nein
- **Altersfreigabe:** Fragebogen aus Inhalt (Ziel ~9+ / PEGI~7) — **nicht** Made for Kids
- **Kategorie:** Spiele / Simulation
- **Export Compliance:** Nein — Info.plist gesetzt

## Nach dem Upload
- TestFlight / Play Internal testen
- Nur Review-/Crash-/Save-Fixes — keine neuen Features
