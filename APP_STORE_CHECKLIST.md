# App Store Connect — Checkliste (1.0.0)

## Vor dem Upload
- [ ] Apple Developer Account aktiv
- [ ] App in App Store Connect angelegt (Bundle ID `com.fidani.metrobuilder`)
- [ ] Privacy Policy öffentlich erreichbar (`public/privacy.html` hosten)
- [ ] Screenshots (iPhone 6.7" mindestens 3 Stück)
- [ ] `npm run cap:sync` auf dem Mac ausgeführt
- [ ] Xcode Signing: eigenes Team

## Archive
1. `npx cap open ios`
2. Destination: Any iOS Device
3. Product → Archive
4. Distribute → App Store Connect → Upload

## Review-Formular
- **Login nötig?** Nein
- **IAP aktiv?** Nein (v1.0.0)
- **Tracking?** Nein
- **Altersfreigabe:** 9+
- **Kategorie:** Spiele / Simulation

## Nach dem Upload
- [ ] Build in Connect auswählen
- [ ] Export Compliance: HTTPS only → meist „Nein“ zu Non-Exempt Encryption
- [ ] Zur Prüfung einreichen
