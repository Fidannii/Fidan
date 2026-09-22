# App Store / Play Store — Checkliste (1.4.0)

Vollständige Anleitung: **[HOCHLADEN.md](./HOCHLADEN.md)**

## Vor dem Upload
- [ ] **Google Play Developer** Account aktiv
- [ ] **Apple Developer** Account aktiv (+ Mac mit Xcode)
- [ ] App in Play Console / App Store Connect angelegt (`com.fidani.metrobuilder`)
- [ ] **IAP Apple:** 4 Consumables (`store/IAP_SETUP.md`)
- [ ] **IAP Google:** dieselben Product IDs + Internal testing AAB
- [ ] Xcode Capability: **In-App Purchase**
- [ ] Sandbox-Kauf (Apple) und/oder License-Tester (Google) OK
- [ ] GitHub Pages: `/docs` → Privacy live
- [ ] Screenshots aus `store/screenshots/` hochgeladen
- [ ] Listing DE: `store/APP_STORE_LISTING_DE.md` + `store/PLAY_STORE_LISTING_DE.md`
- [ ] `npm run cap:sync` ausgeführt
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
- **IAP aktiv?** Ja — Apple App Store + Google Play (Consumables)
- **Tracking?** Nein
- **Altersfreigabe:** 9+ / PEGI 3
- **Kategorie:** Spiele / Simulation
- **Export Compliance:** Nein — Info.plist gesetzt

## Nach dem Upload
- [ ] Build auswählen
- [ ] Zur Prüfung einreichen
