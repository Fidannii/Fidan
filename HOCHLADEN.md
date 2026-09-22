# MetroBuilder — Hochladen in Google Play + Apple App Store

Ja: Das Spiel ist für **Android und iOS** entwickelt (Capacitor).  
Ein Code → zwei native Apps:

| Plattform | Store | Package / Bundle ID | Version |
|-----------|-------|---------------------|---------|
| **Android** | [Google Play Console](https://play.google.com/console) | `com.fidani.metrobuilder` | 1.4.0 (versionCode 6) |
| **iOS** | [App Store Connect](https://appstoreconnect.apple.com) | `com.fidani.metrobuilder` | 1.4.0 (Build 6) |

> „iCloud App Store“ = **Apple App Store**. Käufe laufen über die **Apple-ID** (dieselbe wie iCloud).

---

## Was du brauchst (Accounts)

1. **Google Play Developer** (~25 USD einmalig) → Android hochladen  
2. **Apple Developer Program** (99 USD/Jahr) + **Mac mit Xcode 16+** → iOS hochladen  
3. Privacy-URL live: `https://fidannii.github.io/Fidan/privacy.html`  
   (GitHub → Repo Settings → Pages → Branch `main`, Folder `/docs`)

Ohne diese Accounts kann niemand die App in die Stores stellen — der Code und die Projekte liegen fertig im Repo.

---

## Repo runterladen

```bash
git clone https://github.com/Fidannii/Fidan.git
cd Fidan
git checkout cursor/metrobuilder-game-app-7864   # oder main nach Merge
npm install
npm run cap:sync
```

Danach:

- Android: `npx cap open android` → Android Studio  
- iOS (nur Mac): `npx cap open ios` → Xcode  

---

## A) Google Play Store (Android) — Schritt für Schritt

### 1. Signing-Key einmalig erzeugen

```bash
keytool -genkey -v -keystore metrobuilder-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias metrobuilder
```

Datei **nicht** ins Git legen. Passwörter sicher speichern (Play App Signing empfohlen).

Optional CLI-Signing: `android/key.properties.example` → kopieren nach `android/key.properties` und ausfüllen.

### 2. Signed Bundle (.aab) bauen

In Android Studio:

1. `npx cap open android`
2. **Build → Generate Signed Bundle / APK → Android App Bundle**
3. Deinen Keystore wählen → Release  
4. Output: `android/app/release/app-release.aab`

### 3. Play Console

1. App anlegen → Package name **exakt** `com.fidani.metrobuilder`
2. Store-Eintrag: Texte aus `store/PLAY_STORE_LISTING_DE.md`
3. Screenshots: `store/screenshots/` (Phone)
4. Privacy Policy URL setzen
5. **Internal testing** Track → AAB hochladen → Tester hinzufügen
6. IAP-Produkte anlegen (`store/IAP_SETUP.md`) — gleiche Product IDs wie iOS
7. Später: Production → zur Prüfung einreichen

---

## B) Apple App Store (iOS) — Schritt für Schritt

Nur auf dem **Mac**:

```bash
npm install
npm run cap:sync
npx cap open ios
```

In Xcode:

1. Target **App** → **Signing & Capabilities** → dein Team  
2. Bundle ID = `com.fidani.metrobuilder`  
3. **+ Capability** → **In-App Purchase**  
4. Destination: **Any iOS Device (arm64)**  
5. **Product → Archive → Distribute App → App Store Connect → Upload**

In App Store Connect:

1. Neue App mit Bundle ID `com.fidani.metrobuilder`
2. Texte: `store/APP_STORE_LISTING_DE.md`
3. Screenshots: `store/screenshots/` (iPhone 6.7" mind.)
4. Privacy URL
5. 4 IAP Consumables anlegen (`store/IAP_SETUP.md`)
6. Build auswählen → **Zur Prüfung einreichen**

---

## Fertige Assets im Repo

| Datei | Zweck |
|-------|--------|
| `ios/` | Native iOS-Projekt |
| `android/` | Native Android-Projekt |
| `store/screenshots/` | Store-Bilder |
| `store/APP_STORE_LISTING_DE.md` | Apple Listing |
| `store/PLAY_STORE_LISTING_DE.md` | Google Listing |
| `store/IAP_SETUP.md` | In-App-Käufe beide Stores |
| `docs/privacy.html` | Datenschutz |
| `APP_STORE_CHECKLIST.md` | Kurz-Checkliste |

---

## Wichtig

- **APK/AAB und IPA werden hier nicht fertig signiert ausgeliefert** — Signatur geht nur mit *deinem* Google-/Apple-Konto.
- Der komplette Quellcode + native Projekte sind upload-bereit nach `npm run cap:sync`.
- Kernspiel ohne Zahlung spielbar; Echtgeld-IAP optional über die jeweiligen Stores.
