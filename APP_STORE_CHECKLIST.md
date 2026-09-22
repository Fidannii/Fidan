# App Store Connect — Checkliste (1.0.0)

## Vor dem Upload
- [ ] Apple Developer Account aktiv
- [ ] App in App Store Connect angelegt (Bundle ID `com.fidani.metrobuilder`)
- [ ] GitHub Pages: `/docs` → Privacy live (`…/privacy.html`)
- [ ] Screenshots aus `store/screenshots/` hochgeladen
- [ ] Listing aus `store/APP_STORE_LISTING_DE.md` eingefügt
- [ ] `npm run cap:sync` auf dem Mac ausgeführt
- [ ] Xcode Signing: eigenes Team

## Archive
1. `npx cap open ios`
2. Destination: Any iOS Device
3. Product → Archive
4. Distribute → App Store Connect → Upload

- [ ] IAP-Produkte in App Store Connect angelegt (`store/IAP_SETUP.md`)
- [ ] Xcode Capability: **In-App Purchase**
- [ ] Sandbox-Kauf getestet
- [ ] Review-Notizen mit IAP-Hinweis
- [ ] Login nötig? Nein
- [ ] IAP aktiv? Ja — Consumable XP / Level-Boost
- [ ] Tracking? Nein
- [ ] Altersfreigabe: 9+
- [ ] Kategorie: Spiele / Simulation
- [ ] Export Compliance: Nein (Non-Exempt Encryption) — bereits in Info.plist

## Nach dem Upload
- [ ] Build in Connect auswählen
- [ ] Zur Prüfung einreichen
