# App Store / Play Store — Checkliste (1.4.0)

## Vor dem Upload
- [ ] Apple Developer Account aktiv
- [ ] App in App Store Connect angelegt (Bundle ID `com.fidani.metrobuilder`)
- [ ] **IAP Apple:** 4 Consumables in App Store Connect (`store/IAP_SETUP.md`)
- [ ] **IAP Google:** dieselben Product IDs in Play Console + Internal testing AAB
- [ ] Xcode Capability: **In-App Purchase**
- [ ] Sandbox-Kauf (Apple-ID) und/oder License-Tester (Google) OK
- [ ] GitHub Pages: `/docs` → Privacy live
- [ ] Screenshots aus `store/screenshots/` hochgeladen
- [ ] Listing aus `store/APP_STORE_LISTING_DE.md` eingefügt
- [ ] `npm run cap:sync` auf dem Mac ausgeführt
- [ ] Xcode Signing: eigenes Team

## Archive (iOS / Apple App Store)
1. `npx cap open ios`
2. Optional: Scheme → StoreKit Configuration → `StoreKitConfig.storekit`
3. Destination: Any iOS Device
4. Product → Archive → App Store Connect → Upload

## Bundle (Android / Google Play)
1. `npx cap open android`
2. Generate Signed Bundle → Play Console (Internal testing zuerst)

## Review-Formular
- **Login nötig?** Nein
- **IAP aktiv?** Ja — Apple App Store + Google Play (Consumables)
- **Tracking?** Nein
- **Altersfreigabe:** 9+
- **Kategorie:** Spiele / Simulation
- **Export Compliance:** Nein — Info.plist gesetzt

## Nach dem Upload
- [ ] Build auswählen
- [ ] Zur Prüfung einreichen
