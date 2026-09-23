# MetroBuilder 3.0.0 — App Store Upload (START HIER)

**Bundle / Package ID:** `com.fidani.metrobuilder`  
**Version:** 3.0.0 · **Build / versionCode:** 12  

Ein Code → **iOS (App Store)** + **Android (Google Play)**.

---

## Download

| Was | Link |
|-----|------|
| **ZIP (dieser Branch)** | https://github.com/Fidannii/Fidan/archive/refs/heads/cursor/metrobuilder-rc-harden-7864.zip |
| **Download-Seite** | https://fidannii.github.io/Fidan/download.html |
| **Privacy** | https://fidannii.github.io/Fidan/privacy.html |

Fertiges Paket-Artefakt (Cloud Agent): `MetroBuilder-3.0.0-AppStore-iOS-Android.zip`

Du brauchst fürs Hochladen:
- **Apple:** Mac + Xcode + Apple Developer Program (Individual)
- **Google:** Android Studio + Play Developer Account + eigener Keystore

Ohne Accounts kann niemand eine signierte IPA/AAB erzeugen — das Projekt ist dafür vorbereitet.

---

## 1) Entpacken & vorbereiten

```bash
cd MetroBuilder-3.0.0-AppStore   # oder Ordnername nach GitHub-ZIP
npm ci
npm test          # erwartet 71 PASS
npm run cap:sync
```

---

## 2) iOS → App Store / TestFlight (Mac)

```bash
cd ios/App
pod install
open App.xcworkspace
```

In Xcode:
1. Target **App** → **Signing & Capabilities** → dein Team  
2. Bundle ID bleibt `com.fidani.metrobuilder`  
3. Capability **In-App Purchase**  
4. Destination: **Any iOS Device (arm64)**  
5. **Product → Archive** → Upload → TestFlight  

Store-Texte: `store/final/APPLE_METADATA_DE.md`  
Details: `HOCHLADEN.md` · Checkliste: `docs/APPLE_APP_STORE_CONNECT_CHECKLIST.md`

---

## 3) Android → Google Play

```bash
npx cap open android
```

In Android Studio:
1. Keystore lokal erzeugen (nie committen) — siehe `HOCHLADEN.md`  
2. **Build → Generate Signed Bundle** → `.aab`  
3. Play Console → App `com.fidani.metrobuilder` → Internal testing  

Store-Texte: `store/final/GOOGLE_METADATA_DE.md`  
Checkliste: `docs/GOOGLE_PLAY_CONSOLE_CHECKLIST.md`

---

## Was enthalten ist

| Ordner | Zweck |
|--------|--------|
| `ios/` | Native iOS (Capacitor 7) |
| `android/` | Native Android |
| `store/final/` | Finale Store-Metadaten DE/EN |
| `docs/privacy.html` | Datenschutz |
| `qa/screens/` | QA-Referenz (finale Device-Screenshots noch extern) |

**Nicht enthalten:** Signatur / IPA / AAB — nur mit deinen Accounts auf deinem Rechner.
