# MetroBuilder 2.0.0 — App Store Upload (START HIER)

**Bundle ID:** `com.fidani.metrobuilder`  
**Version:** 2.0.0 · Build 10  

Du brauchst: **Mac + Xcode 16+** + **Apple Developer Program** (99 USD/Jahr).  
Eine fertige signierte IPA kann niemand ohne *dein* Apple-Team erzeugen — dieses Paket ist dafür vorbereitet.

---

## 1) ZIP entpacken & vorbereiten

```bash
cd MetroBuilder-2.0.0-appstore   # Ordnername nach Entpacken
npm install
npm run cap:sync
cd ios/App
pod install                     # einmalig, braucht CocoaPods
open App.xcworkspace            # WICHTIG: .xcworkspace, nicht .xcodeproj
```

Oder kürzer aus dem Projektroot:

```bash
npm install && npm run cap:ios
```

---

## 2) In Xcode (5 Minuten)

1. Links Target **App** wählen  
2. **Signing & Capabilities** → Team = dein Apple Developer Team  
3. Bundle Identifier bleibt **`com.fidani.metrobuilder`**  
4. **+ Capability** → **In-App Purchase**  
5. Oben Destination: **Any iOS Device (arm64)** (kein Simulator)  
6. Menü **Product → Archive**  
7. Organizer → **Distribute App → App Store Connect → Upload**

`ios/exportOptions.plist` ist für App Store Connect Upload vorbereitet (Automatic Signing).

---

## 3) App Store Connect

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → neue App  
2. Bundle ID: `com.fidani.metrobuilder`  
3. Texte: `store/APP_STORE_LISTING_DE.md` (EN: `store/APP_STORE_LISTING_EN.md`)  
4. Screenshots: `store/screenshots/` (mind. iPhone 6.7")  
5. Privacy: `https://fidannii.github.io/Fidan/privacy.html`  
6. IAP: `store/IAP_SETUP.md` (4 Consumables, gleiche IDs wie Android)  
7. Build auswählen → **Zur Prüfung einreichen**

Kurz-Checkliste: `APP_STORE_CHECKLIST.md`  
Play Store parallel: `HOCHLADEN.md`

---

## Was im ZIP liegt

| Ordner / Datei | Zweck |
|----------------|--------|
| `ios/` | Native iOS-Projekt (Capacitor 7, sync’d) |
| `android/` | Native Android-Projekt (Play Store) |
| `store/` | Listings, Screenshots, IAP |
| `docs/privacy.html` | Datenschutz |
| `HOCHLADEN.md` | Beide Stores ausführlich |

**Nicht enthalten:** Signatur / IPA — die entsteht nur auf deinem Mac mit deinem Team.
